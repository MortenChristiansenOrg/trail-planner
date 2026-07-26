import { randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rename, rm, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { compileCatalog } from "./compile-catalog.mjs";
import { validateCatalogRecord } from "./validate-record.mjs";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const dryRun = args.includes("--dry-run");
const files = args.filter((argument) => argument !== "--dry-run");

if (files.length !== 1) {
  console.error("Usage: node scripts/catalog-data/publish-record.mjs [--dry-run] <record.json>");
  process.exit(2);
}

function isWithin(directory, candidate) {
  const pathFromDirectory = relative(directory, candidate);
  return pathFromDirectory !== "" && pathFromDirectory !== ".." && !pathFromDirectory.startsWith(`..${sep}`) && !isAbsolute(pathFromDirectory);
}

const sourcePath = await realpath(resolve(files[0]));
const workDir = await realpath(resolve(".catalog-work"));
const outputDir = resolve("data/catalog/records");
if (isWithin(outputDir, sourcePath)) {
  console.error("Refusing to publish an existing record in place; use a candidate under .catalog-work");
  process.exit(1);
}
if (!isWithin(workDir, sourcePath)) {
  console.error("Publication source must be a record under .catalog-work");
  process.exit(1);
}

const record = JSON.parse(await readFile(sourcePath, "utf8"));
const errors = validateCatalogRecord(record);
if (errors.length) {
  console.error(`${sourcePath}: invalid`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const key = record.destination.key;
if (basename(sourcePath) !== `${key}.json`) {
  console.error(`Record filename must be ${key}.json before publication`);
  process.exit(1);
}

const destinationPath = join(outputDir, `${key}.json`);
const filename = `${key}.json`;
const overrides = new Map([[filename, record]]);
const lockPath = join(workDir, ".catalog-publication.lock");
const lockOwnerPath = join(lockPath, "owner.json");
const lockRecoveryPath = join(lockPath, "recovery.json");
const staleLockMs = 15 * 60 * 1000;
const lockToken = `${process.pid}-${randomUUID()}`;

function buildLockOwner() {
  return {
    pid: process.pid,
    token: lockToken,
    acquiredAt: new Date().toISOString(),
  };
}

function errorHasCode(error, code) {
  return error instanceof Error && "code" in error && error.code === code;
}

async function readLockMetadata(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return undefined;
  }
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (errorHasCode(error, "ENOENT")) return false;
    throw error;
  }
}

function processIsRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !errorHasCode(error, "ESRCH");
  }
}

async function acquireLock(allowRecovery = true) {
  try {
    await mkdir(lockPath);
    try {
      await writeFile(lockOwnerPath, `${JSON.stringify(buildLockOwner(), null, 2)}\n`, {
        flag: "wx",
      });
    } catch (error) {
      await rmdir(lockPath).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (!errorHasCode(error, "EEXIST")) throw error;
    const owner = await readLockMetadata(lockOwnerPath);
    const acquiredAt = typeof owner?.acquiredAt === "string"
      ? Date.parse(owner.acquiredAt)
      : Number.NaN;
    const recoverable = allowRecovery &&
      typeof owner?.token === "string" &&
      Number.isFinite(acquiredAt) &&
      Date.now() - acquiredAt > staleLockMs &&
      !processIsRunning(owner.pid);
    if (recoverable) {
      const recovery = {
        ownerToken: owner.token,
        recoveryToken: lockToken,
        pid: process.pid,
        startedAt: new Date().toISOString(),
      };
      try {
        await writeFile(
          lockRecoveryPath,
          `${JSON.stringify(recovery, null, 2)}\n`,
          { flag: "wx" },
        );
      } catch (cleanupError) {
        const existingClaim = errorHasCode(cleanupError, "EEXIST")
          ? await readLockMetadata(lockRecoveryPath)
          : undefined;
        const claimStartedAt = typeof existingClaim?.startedAt === "string"
          ? Date.parse(existingClaim.startedAt)
          : Number.NaN;
        const claimAbandoned = Number.isFinite(claimStartedAt) &&
          Date.now() - claimStartedAt > staleLockMs &&
          !processIsRunning(existingClaim?.pid);
        if (!claimAbandoned) {
          throw new Error(
            `Unable to claim stale catalog publication lock ${lockPath}. ` +
            `If no publisher is running, remove this lock directory manually.`,
            { cause: cleanupError },
          );
        }
        await writeFile(
          lockRecoveryPath,
          `${JSON.stringify(recovery, null, 2)}\n`,
        );
      }
      try {
        const currentOwner = await readLockMetadata(lockOwnerPath);
        const currentRecovery = await readLockMetadata(lockRecoveryPath);
        const currentAcquiredAt = typeof currentOwner?.acquiredAt === "string"
          ? Date.parse(currentOwner.acquiredAt)
          : Number.NaN;
        if (
          currentOwner?.token !== owner.token ||
          currentRecovery?.recoveryToken !== lockToken ||
          !Number.isFinite(currentAcquiredAt) ||
          Date.now() - currentAcquiredAt <= staleLockMs ||
          processIsRunning(currentOwner.pid)
        ) {
          throw new Error("Catalog publication lock ownership changed during recovery", {
            cause: error,
          });
        }
        await rm(lockPath, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 50,
        });
      } catch (cleanupError) {
        const claim = await readLockMetadata(lockRecoveryPath);
        if (claim?.recoveryToken === lockToken) {
          await unlink(lockRecoveryPath).catch(() => {});
        }
        throw new Error(`Unable to recover stale catalog publication lock ${lockPath}`, {
          cause: cleanupError,
        });
      }
      return await acquireLock(false);
    }
    const ownerDescription = Number.isInteger(owner?.pid) && typeof owner?.acquiredAt === "string"
      ? ` by PID ${owner.pid} since ${owner.acquiredAt}`
      : "";
    throw new Error(
      `Another catalog publication holds ${lockPath}${ownerDescription}. ` +
      `If no publisher is running, remove this lock directory manually.`,
      { cause: error },
    );
  }
}

async function releaseLock() {
  const owner = await readLockMetadata(lockOwnerPath);
  if (owner === undefined && !(await pathExists(lockPath))) return;
  if (owner?.token !== lockToken) {
    throw new Error("Catalog publication lock ownership changed before release");
  }
  try {
    await unlink(lockOwnerPath);
  } catch (error) {
    if (errorHasCode(error, "ENOENT") && !(await pathExists(lockPath))) return;
    throw error;
  }
  try {
    await rmdir(lockPath);
  } catch (error) {
    if (errorHasCode(error, "ENOENT")) {
      // A stale-lock recovery that already verified this owner completed first.
      return;
    }
    if (errorHasCode(error, "ENOTEMPTY") || errorHasCode(error, "EEXIST")) {
      const recovery = await readLockMetadata(lockRecoveryPath);
      if (recovery?.ownerToken === lockToken) return;
      await writeFile(
        lockOwnerPath,
        `${JSON.stringify(buildLockOwner(), null, 2)}\n`,
        { flag: "wx" },
      ).catch(() => {});
    }
    throw error;
  }
}

await acquireLock();
let operationError;
let lockReleaseError;
try {
  if (dryRun) {
    const deployment = await compileCatalog({ emit: false, recordOverrides: overrides });
    console.log(`${sourcePath}: publication check passed -> ${destinationPath} (catalog ${deployment.catalogVersion})`);
  } else {
    // Validate the complete candidate version before changing canonical source.
    // Serving reads generated artifacts, and deployment activates the compiled
    // Convex version only after its count/reference validation succeeds.
    await compileCatalog({ emit: false, recordOverrides: overrides });
    await mkdir(outputDir, { recursive: true });
    let previous;
    try {
      previous = await readFile(destinationPath, "utf8");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const temporaryPath = join(outputDir, `.${key}.${process.pid}.tmp`);
    await writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`);
    await rename(temporaryPath, destinationPath);
    try {
      const deployment = await compileCatalog();
      console.log(`${destinationPath}: published (${record.claims.length} claims, ${record.coverage.length} domains, catalog ${deployment.catalogVersion})`);
    } catch (publicationError) {
      const rollbackFailures = [];
      try {
        if (previous === undefined) await unlink(destinationPath);
        else {
          const rollbackPath = join(outputDir, `.${key}.${process.pid}.rollback`);
          await writeFile(rollbackPath, previous);
          await rename(rollbackPath, destinationPath);
        }
      } catch (rollbackError) {
        rollbackFailures.push(`record rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
      }
      try {
        await compileCatalog();
      } catch (rollbackCompileError) {
        rollbackFailures.push(`artifact recovery failed: ${rollbackCompileError instanceof Error ? rollbackCompileError.message : String(rollbackCompileError)}`);
      }
      if (rollbackFailures.length) {
        console.error(`Catalog publication failed and recovery reported:\n${rollbackFailures.join("\n")}`);
      }
      throw publicationError;
    }
  }
} catch (error) {
  operationError = error;
  throw error;
} finally {
  try {
    await releaseLock();
  } catch (error) {
    lockReleaseError = error;
    if (operationError) {
      console.error(`Failed to release catalog publication lock: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
if (lockReleaseError) throw lockReleaseError;
