import { mkdir, readFile, realpath, rename, rmdir, unlink, writeFile } from "node:fs/promises";
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
const staleLockMs = 15 * 60 * 1000;

async function acquireLock(allowRecovery = true) {
  try {
    await mkdir(lockPath);
    await writeFile(lockOwnerPath, `${JSON.stringify({
      pid: process.pid,
      acquiredAt: new Date().toISOString(),
    }, null, 2)}\n`);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) {
      throw error;
    }
    let owner;
    try {
      owner = JSON.parse(await readFile(lockOwnerPath, "utf8"));
    } catch {
      // A lock without readable ownership metadata is never removed automatically.
    }
    const acquiredAt = typeof owner?.acquiredAt === "string"
      ? Date.parse(owner.acquiredAt)
      : Number.NaN;
    if (allowRecovery && Number.isFinite(acquiredAt) && Date.now() - acquiredAt > staleLockMs) {
      await unlink(lockOwnerPath);
      await rmdir(lockPath);
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
    await unlink(lockOwnerPath);
    await rmdir(lockPath);
  } catch (error) {
    lockReleaseError = error;
    if (operationError) {
      console.error(`Failed to release catalog publication lock: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
if (lockReleaseError) throw lockReleaseError;
