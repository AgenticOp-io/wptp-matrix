#!/usr/bin/env node
import { resolve } from "node:path";
import { composeHarIrNextJs, composeOpenApiIrNextJs } from "./compose.js";
import { composeHarIrHono, composeOpenApiIrHono } from "./compose-hono.js";
import { verifyComposedNextJsBronze } from "./verify-contract.js";
import { verifyComposedHonoBronze } from "./verify-hono-bronze.js";

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

function usage(): never {
  process.stderr.write(
    "Usage: wptp-compose --path <openapi-ir-nextjs|har-ir-nextjs|openapi-ir-hono|har-ir-hono> --in <file> --out <dir> [--verify]\n",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
let pathId: string | null = null;
let input: string | null = null;
let out: string | null = null;
let verify = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--path" && args[i + 1]) pathId = args[++i];
  else if (args[i] === "--in" && args[i + 1]) input = args[++i];
  else if (args[i] === "--out" && args[i + 1]) out = args[++i];
  else if (args[i] === "--verify") verify = true;
}

if (!pathId || !input || !out) usage();

const outDir = resolve(out);
const inPath = resolve(input);

if (pathId === "openapi-ir-nextjs") {
  const result = composeOpenApiIrNextJs(inPath, outDir);
  console.log(
    JSON.stringify(
      { ok: true, pathId: result.pathId, filesWritten: result.filesWritten, irNodeCount: result.irNodeCount },
      null,
      2,
    ),
  );
  if (verify) {
    const v = verifyComposedNextJsBronze(outDir, result, OPENAPI_ROUTES);
    if (!v.ok) {
      process.stderr.write(`${JSON.stringify(v, null, 2)}\n`);
      process.exit(1);
    }
    console.error("contract verify: OK");
  }
} else if (pathId === "har-ir-nextjs") {
  const result = composeHarIrNextJs(inPath, outDir);
  console.log(
    JSON.stringify(
      { ok: true, pathId: result.pathId, filesWritten: result.filesWritten, irNodeCount: result.irNodeCount },
      null,
      2,
    ),
  );
  if (verify) {
    const v = verifyComposedNextJsBronze(outDir, result, HAR_ROUTES);
    if (!v.ok) {
      process.stderr.write(`${JSON.stringify(v, null, 2)}\n`);
      process.exit(1);
    }
    console.error("contract verify: OK");
  }
} else if (pathId === "openapi-ir-hono") {
  const result = composeOpenApiIrHono(inPath, outDir);
  console.log(
    JSON.stringify(
      {
        ok: true,
        pathId: result.pathId,
        filesWritten: result.filesWritten,
        irNodeCount: result.irNodeCount,
        handlerNames: result.handlerNames,
      },
      null,
      2,
    ),
  );
  if (verify) {
    const v = verifyComposedHonoBronze(outDir, result, ["listPets", "createPet", "getPet"]);
    if (!v.ok) {
      process.stderr.write(`${JSON.stringify(v, null, 2)}\n`);
      process.exit(1);
    }
    console.error("contract verify: OK");
  }
} else if (pathId === "har-ir-hono") {
  const result = composeHarIrHono(inPath, outDir);
  console.log(
    JSON.stringify(
      {
        ok: true,
        pathId: result.pathId,
        filesWritten: result.filesWritten,
        irNodeCount: result.irNodeCount,
        handlerNames: result.handlerNames,
      },
      null,
      2,
    ),
  );
  if (verify) {
    const v = verifyComposedHonoBronze(outDir, result, result.handlerNames);
    if (!v.ok) {
      process.stderr.write(`${JSON.stringify(v, null, 2)}\n`);
      process.exit(1);
    }
    console.error("contract verify: OK");
  }
} else {
  usage();
}
