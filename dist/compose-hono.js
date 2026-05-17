import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { importHarJson } from "@wptp/adapter-browser";
import { assertIrDocumentV0 } from "@wptp/ir";
import { emitHonoBronzeProject } from "@wptp/emit-hono";
function writeHonoProject(outDir, emitted) {
    const filesWritten = [];
    for (const file of emitted.files) {
        const abs = join(outDir, file.relativePath);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, file.contents, "utf8");
        filesWritten.push(file.relativePath);
    }
    return filesWritten;
}
function composeIrToHono(pathId, ir, outDir) {
    assertIrDocumentV0(ir);
    const emitted = emitHonoBronzeProject(ir);
    return {
        pathId,
        filesWritten: writeHonoProject(outDir, emitted),
        irNodeCount: ir.nodes.length,
        skippedEmit: emitted.skipped.length,
        handlerNames: emitted.bindings.map((b) => b.handlerName),
    };
}
export function composeOpenApiIrHono(openapiJsonPath, outDir, sourceApp) {
    const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
    const ir = importOpenApiJson(openapi, sourceApp);
    return composeIrToHono("openapi-ir-hono", ir, outDir);
}
export function composeHarIrHono(harJsonPath, outDir, sourceApp) {
    const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
    const ir = importHarJson(har, sourceApp);
    return composeIrToHono("har-ir-hono", ir, outDir);
}
