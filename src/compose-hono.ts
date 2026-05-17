import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { importHarJson } from "@wptp/adapter-browser";
import { assertIrDocumentV0, type IrDocumentV0 } from "@wptp/ir";
import { emitHonoBronzeProject, type EmitHonoBronzeResult } from "@wptp/emit-hono";

export interface ComposeHonoResult {
  readonly pathId: string;
  readonly filesWritten: ReadonlyArray<string>;
  readonly irNodeCount: number;
  readonly skippedEmit: number;
  readonly handlerNames: ReadonlyArray<string>;
}

function writeHonoProject(outDir: string, emitted: EmitHonoBronzeResult): string[] {
  const filesWritten: string[] = [];
  for (const file of emitted.files) {
    const abs = join(outDir, file.relativePath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents, "utf8");
    filesWritten.push(file.relativePath);
  }
  return filesWritten;
}

function composeIrToHono(pathId: string, ir: IrDocumentV0, outDir: string): ComposeHonoResult {
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

export function composeOpenApiIrHono(
  openapiJsonPath: string,
  outDir: string,
  sourceApp?: string,
): ComposeHonoResult {
  const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
  const ir = importOpenApiJson(openapi, sourceApp);
  return composeIrToHono("openapi-ir-hono", ir, outDir);
}

export function composeHarIrHono(harJsonPath: string, outDir: string, sourceApp?: string): ComposeHonoResult {
  const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
  const ir = importHarJson(har, sourceApp);
  return composeIrToHono("har-ir-hono", ir, outDir);
}
