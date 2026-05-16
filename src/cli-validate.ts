import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertCompatibilityMatrix } from "./validate.js";

const path = resolve(process.argv[2] ?? "data/matrix.v0.json");
const json = JSON.parse(readFileSync(path, "utf8"));
assertCompatibilityMatrix(json);
console.log(`OK: ${path} (${json.edges.length} edges)`);
