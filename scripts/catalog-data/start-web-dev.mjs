import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

function readEnvironment(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^(['"])(.*)\1$/u, "$2")];
      }),
  );
}

const localEnvironment = readEnvironment(await readFile(".env.local", "utf8"));
const convexUrl = localEnvironment.CONVEX_URL;
if (!convexUrl) throw new Error("CONVEX_URL is missing from the local Convex environment");

const child = spawn(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["--filter", "@trail-planner/web", "exec", "vite"],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_CONVEX_URL: convexUrl },
  },
);
child.on("error", (error) => {
  throw error;
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
