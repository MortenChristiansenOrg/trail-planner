import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...options.env },
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed ${signal ? `with signal ${signal}` : `with exit code ${code}`}`));
    });
  });
}

const captureCommand = "node scripts/catalog-data/capture-convex-url.mjs";
const deployArgs = [
  "exec",
  "convex",
  "deploy",
  "--cmd-url-env-var-name",
  "VITE_CONVEX_URL",
  "--cmd",
  captureCommand,
];
const vercelEnvironment = process.env.VERCEL_ENV;
await run("pnpm", ["catalog:check"]);
if (vercelEnvironment === "preview") {
  deployArgs.push("--preview-run", "ingest/catalogSync:synchronize");
}

await run("pnpm", deployArgs);
if (vercelEnvironment === "production") {
  await run("pnpm", ["exec", "convex", "run", "ingest/catalogSync:synchronize", "{}", "--prod"]);
}

const convexUrl = (await readFile(".catalog-work/convex-deployment-url", "utf8")).trim();
await run("pnpm", ["--filter", "@trail-planner/web", "build"], {
  env: { VITE_CONVEX_URL: convexUrl },
});
