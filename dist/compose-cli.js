#!/usr/bin/env node
import { resolve } from "node:path";
import { composeHarIrNextJs, composeOpenApiIrNextJs } from "./compose.js";
import { verifyComposedNextJsBronze } from "./verify-contract.js";
const OPENAPI_ROUTES = [
    { path: "/pets", method: "GET", file: "app/pets/route.ts" },
    { path: "/pets", method: "POST", file: "app/pets/route.ts" },
    { path: "/pets/{id}", method: "GET", file: "app/pets/{id}/route.ts" },
];
const HAR_ROUTES = [
    { path: "/api/pets", method: "GET", file: "app/api/pets/route.ts" },
    { path: "/api/pets", method: "POST", file: "app/api/pets/route.ts" },
    { path: "/api/pets/42", method: "GET", file: "app/api/pets/42/route.ts" },
];
function usage() {
    process.stderr.write("Usage: wptp-compose --path <openapi-ir-nextjs|har-ir-nextjs> --in <file> --out <dir> [--verify]\n");
    process.exit(1);
}
const args = process.argv.slice(2);
let pathId = null;
let input = null;
let out = null;
let verify = false;
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--path" && args[i + 1])
        pathId = args[++i];
    else if (args[i] === "--in" && args[i + 1])
        input = args[++i];
    else if (args[i] === "--out" && args[i + 1])
        out = args[++i];
    else if (args[i] === "--verify")
        verify = true;
}
if (!pathId || !input || !out)
    usage();
const outDir = resolve(out);
const inPath = resolve(input);
let result;
let routes;
if (pathId === "openapi-ir-nextjs") {
    result = composeOpenApiIrNextJs(inPath, outDir);
    routes = OPENAPI_ROUTES;
}
else if (pathId === "har-ir-nextjs") {
    result = composeHarIrNextJs(inPath, outDir);
    routes = HAR_ROUTES;
}
else {
    usage();
}
console.log(JSON.stringify({ ok: true, pathId: result.pathId, filesWritten: result.filesWritten, irNodeCount: result.irNodeCount }, null, 2));
if (verify) {
    const v = verifyComposedNextJsBronze(outDir, result, routes);
    if (!v.ok) {
        process.stderr.write(`${JSON.stringify(v, null, 2)}\n`);
        process.exit(1);
    }
    console.error("contract verify: OK");
}
