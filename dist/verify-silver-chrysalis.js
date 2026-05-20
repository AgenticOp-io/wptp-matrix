import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composeHarIrHonoChrysalis, composeOpenApiIrHonoChrysalis } from "./compose-chrysalis-hono.js";
import { composeHarIrNextJsChrysalis, composeOpenApiIrNextJsChrysalis } from "./compose-chrysalis-nextjs.js";
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
export function runSilverOpenApiIrNextJsChrysalis(openapiPath, chrysalisRoot, wptpEmitNextJsRoot) {
    return runSilverCompose("openapi-ir-nextjs-chrysalis", (input, out, chrysalis) => composeOpenApiIrNextJsChrysalis(input, out, {
        chrysalisRoot: chrysalis,
        wptpEmitNextJsRoot: wptpEmitNextJsRoot,
    }), openapiPath, chrysalisRoot);
}
export function runSilverEchoApiIrNextJsChrysalis(openapiPath, chrysalisRoot, wptpEmitNextJsRoot) {
    return runSilverCompose("echo-api-ir-nextjs-chrysalis", (input, out, chrysalis) => composeOpenApiIrNextJsChrysalis(input, out, {
        chrysalisRoot: chrysalis,
        wptpEmitNextJsRoot: wptpEmitNextJsRoot,
    }), openapiPath, chrysalisRoot);
}
export function runSilverHarIrNextJsChrysalis(harPath, chrysalisRoot, wptpEmitNextJsRoot) {
    return runSilverCompose("har-ir-nextjs-chrysalis", (input, out, chrysalis) => composeHarIrNextJsChrysalis(input, out, {
        chrysalisRoot: chrysalis,
        wptpEmitNextJsRoot: wptpEmitNextJsRoot,
    }), harPath, chrysalisRoot);
}
