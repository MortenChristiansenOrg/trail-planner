import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.VITE_CONVEX_URL;
if (!url) throw new Error("VITE_CONVEX_URL was not provided by Convex deploy");
await mkdir(".catalog-work", { recursive: true });
await writeFile(".catalog-work/convex-deployment-url", `${url}\n`);
