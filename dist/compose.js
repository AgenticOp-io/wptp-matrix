import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { importHarJson } from "@wptp/adapter-browser";
import { assertIrDocumentV0 } from "@wptp/ir";
import { emitNextJsAppRouter } from "@wptp/emit-nextjs";
function writeEmitted(outDir, emitted) {
    const filesWritten = [];
    for (const file of emitted.files) {
        const abs = join(outDir, file.relativePath);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, file.contents, "utf8");
        filesWritten.push(file.relativePath);
    }
    return filesWritten;
}
function composeIrToNextJs(pathId, ir, outDir) {
    assertIrDocumentV0(ir);
    const emitted = emitNextJsAppRouter(ir);
    return {
        pathId,
        filesWritten: writeEmitted(outDir, emitted),
        irNodeCount: ir.nodes.length,
        skippedEmit: emitted.skipped.length,
    };
}
export function composeOpenApiIrNextJs(openapiJsonPath, outDir, sourceApp) {
    const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
    const ir = importOpenApiJson(openapi, sourceApp);
    return composeIrToNextJs("openapi-ir-nextjs", ir, outDir);
}
export function composeHarIrNextJs(harJsonPath, outDir, sourceApp) {
    const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
    const ir = importHarJson(har, sourceApp);
    return composeIrToNextJs("har-ir-nextjs", ir, outDir);
}
