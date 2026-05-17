import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { importHarJson } from "@wptp/adapter-browser";
import { assertIrDocumentV0, type IrDocumentV0 } from "@wptp/ir";
import { emitFastifyBronzeProject, type EmitFastifyBronzeResult } from "@wptp/emit-fastify";

export interface ComposeFastifyResult {
  readonly pathId: string;
  readonly filesWritten: ReadonlyArray<string>;
  readonly irNodeCount: number;
  readonly skippedEmit: number;
  readonly handlerNames: ReadonlyArray<string>;
}

function writeFastifyProject(outDir: string, emitted: EmitFastifyBronzeResult): string[] {
  const filesWritten: string[] = [];
  for (const file of emitted.files) {
    const abs = join(outDir, file.relativePath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents, "utf8");
    filesWritten.push(file.relativePath);
  }
  return filesWritten;
}

function composeIrToFastify(pathId: string, ir: IrDocumentV0, outDir: string): ComposeFastifyResult {
  assertIrDocumentV0(ir);
  const emitted = emitFastifyBronzeProject(ir);
  return {
    pathId,
    filesWritten: writeFastifyProject(outDir, emitted),
    irNodeCount: ir.nodes.length,
    skippedEmit: emitted.skipped.length,
    handlerNames: emitted.bindings.map((b) => b.handlerName),
  };
}

export function composeOpenApiIrFastify(
  openapiJsonPath: string,
  outDir: string,
  sourceApp?: string,
): ComposeFastifyResult {
  const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
  const ir = importOpenApiJson(openapi, sourceApp);
  return composeIrToFastify("openapi-ir-fastify", ir, outDir);
}

export function composeHarIrFastify(harJsonPath: string, outDir: string, sourceApp?: string): ComposeFastifyResult {
  const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
  const ir = importHarJson(har, sourceApp);
  return composeIrToFastify("har-ir-fastify", ir, outDir);
}
