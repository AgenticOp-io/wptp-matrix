import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "_site");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, "site"), out, { recursive: true });
mkdirSync(join(out, "data"), { recursive: true });
cpSync(join(root, "data", "matrix.v0.json"), join(out, "data", "matrix.v0.json"));
cpSync(join(root, "data", "composer-paths.v0.json"), join(out, "data", "composer-paths.v0.json"));

console.log("build-site: wrote", out);
