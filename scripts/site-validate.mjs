import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const rel of ["data/matrix.v0.json", "data/composer-paths.v0.json"]) {
  const path = join(root, rel);
  const json = JSON.parse(readFileSync(path, "utf8"));
  if (!json.schemaVersion) {
    console.error(`site-validate: missing schemaVersion in ${rel}`);
    process.exit(1);
  }
}

const html = readFileSync(join(root, "site", "index.html"), "utf8");
if (!html.includes("matrix.v0.json") || !html.includes("composer-paths.v0.json")) {
  console.error("site-validate: site/index.html must load matrix and composer JSON");
  process.exit(1);
}

console.log("site-validate: OK");
