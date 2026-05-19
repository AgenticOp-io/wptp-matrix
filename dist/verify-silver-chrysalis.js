import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composeHarIrHonoChrysalis, composeOpenApiIrHonoChrysalis } from "./compose-chrysalis-hono.js";
function runSilverCompose(id, composeFn, inputPath, chrysalisRoot) {
    if (!chrysalisRoot?.trim()) {
        return {
            id,
            grade: "silver",
            ok: true,
            detail: "skipped (set CHRYSALIS_ROOT for Chrysalis WebIR emit-hono silver)",
        };
    }
    const root = chrysalisRoot.trim();
    const outDir = mkdtempSync(join(tmpdir(), "wptp-silver-"));
    try {
        const result = composeFn(inputPath, outDir, root);
        return {
            id,
            grade: "silver",
            ok: result.emitOk && result.handlerCount > 0,
            detail: `emitOk=${result.emitOk} handlers=${result.handlerCount}`,
        };
    }
    finally {
        rmSync(outDir, { recursive: true, force: true });
    }
}
export function runSilverOpenApiIrHonoChrysalis(openapiPath, chrysalisRoot) {
    return runSilverCompose("openapi-ir-hono-chrysalis", (input, out, chrysalis) => composeOpenApiIrHonoChrysalis(input, out, { chrysalisRoot: chrysalis }), openapiPath, chrysalisRoot);
}
export function runSilverHarIrHonoChrysalis(harPath, chrysalisRoot) {
    return runSilverCompose("har-ir-hono-chrysalis", (input, out, chrysalis) => composeHarIrHonoChrysalis(input, out, { chrysalisRoot: chrysalis }), harPath, chrysalisRoot);
}
