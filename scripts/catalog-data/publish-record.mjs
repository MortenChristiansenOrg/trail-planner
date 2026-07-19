import { mkdir, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
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
if (dryRun) {
  console.log(`${sourcePath}: publication check passed -> ${destinationPath}`);
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });
const temporaryPath = join(outputDir, `.${key}.${process.pid}.tmp`);
await writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`);
await rename(temporaryPath, destinationPath);
console.log(`${destinationPath}: published (${record.claims.length} claims, ${record.coverage.length} domains)`);
