import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertIrDocumentV0, importWebIrBundleJson, summarizeLosses } from "@wptp/ir";
import { composeHarIrNextJs, composeOpenApiIrNextJs } from "./compose.js";
import { composeOpenApiIrHono } from "./compose-hono.js";
import { verifyComposedHonoBronze, verifyComposedHonoRuntime } from "./verify-hono-bronze.js";
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
/** Normative harness catalog (grades align with MASTER-PROGRAM §7). */
export const HARNESS_CASES = [
    { id: "openapi-ir-nextjs", grade: "bronze", description: "OpenAPI → IR → Next.js contract stubs" },
    { id: "har-ir-nextjs", grade: "bronze", description: "HAR → IR → Next.js contract stubs" },
    { id: "webir-neutral-ir", grade: "silver", description: "Chrysalis WebIR bundle → IR v0 (loss report)" },
    { id: "openapi-ir-hono", grade: "bronze", description: "OpenAPI → IR → @wptp/emit-hono stubs (runtime JSON)" },
    { id: "php-webir-hono", grade: "gold", description: "Chrysalis ingest + emit-hono + verify (monolith CI)" },
];
function runBronzeCompose(id, composeFn, inputPath, outDir, routes) {
    const compose = composeFn(inputPath, outDir);
    const contract = verifyComposedNextJsBronze(outDir, compose, routes);
    return {
        id,
        grade: "bronze",
        ok: contract.ok,
        detail: `files=${compose.filesWritten.length} skipped=${compose.skippedEmit}`,
        contract,
    };
}
function runSilverWebIrImport(bundlePath) {
    const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
    const doc = importWebIrBundleJson(bundle);
    assertIrDocumentV0(doc);
    const summary = summarizeLosses(doc);
    const ok = summary.lossCount === 0 && doc.nodes.length > 0;
    return {
        id: "webir-neutral-ir",
        grade: "silver",
        ok,
        detail: `nodes=${doc.nodes.length} losses=${summary.lossCount}`,
    };
}
/** Run in-repo harness cases (bronze compose + silver WebIR import). Gold runs in Chrysalis CI. */
export async function runMatrixHarness(options) {
    const root = options.fixtureRoot;
    const results = [];
    results.push(runBronzeCompose("openapi-ir-nextjs", composeOpenApiIrNextJs, join(root, "petstore-mini.openapi.json"), join(options.outDir, "openapi-nextjs"), OPENAPI_ROUTES));
    results.push(runBronzeCompose("har-ir-nextjs", composeHarIrNextJs, join(root, "mini.har.json"), join(options.outDir, "har-nextjs"), HAR_ROUTES));
    results.push(runSilverWebIrImport(join(root, "minimal-route.webir.bundle.json")));
    const honoOut = join(options.outDir, "openapi-hono");
    const hono = composeOpenApiIrHono(join(root, "petstore-mini.openapi.json"), honoOut);
    const honoVerify = verifyComposedHonoBronze(honoOut, hono, ["listPets", "createPet", "getPet"]);
    const honoRuntime = await verifyComposedHonoRuntime(honoOut, [
        { method: "GET", path: "/pets" },
        { method: "POST", path: "/pets" },
        { method: "GET", path: "/pets/{id}" },
    ]);
    results.push({
        id: "openapi-ir-hono",
        grade: "bronze",
        ok: honoVerify.ok && honoRuntime.ok,
        detail: `handlers=${hono.handlerNames.length} runtime=${honoRuntime.ok}`,
    });
    return results;
}
export function harnessSummary(results) {
    const failed = results.filter((r) => !r.ok).map((r) => r.id);
    return { ok: failed.length === 0, failed };
}
