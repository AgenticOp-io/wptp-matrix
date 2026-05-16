import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { importHarJson } from "@wptp/adapter-browser";
import { assertIrDocumentV0, type IrDocumentV0 } from "@wptp/ir";
import { emitNextJsAppRouter, type EmitNextJsResult } from "@wptp/emit-nextjs";

export interface ComposeResult {
  readonly pathId: string;
  readonly filesWritten: ReadonlyArray<string>;
  readonly irNodeCount: number;
  readonly skippedEmit: number;
}

function writeEmitted(outDir: string, emitted: EmitNextJsResult): string[] {
  const filesWritten: string[] = [];
  for (const file of emitted.files) {
    const abs = join(outDir, file.relativePath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents, "utf8");
    filesWritten.push(file.relativePath);
  }
  return filesWritten;
}

function composeIrToNextJs(pathId: string, ir: IrDocumentV0, outDir: string): ComposeResult {
  assertIrDocumentV0(ir);
  const emitted = emitNextJsAppRouter(ir);
  return {
    pathId,
    filesWritten: writeEmitted(outDir, emitted),
    irNodeCount: ir.nodes.length,
    skippedEmit: emitted.skipped.length,
  };
}

export function composeOpenApiIrNextJs(
  openapiJsonPath: string,
  outDir: string,
  sourceApp?: string,
): ComposeResult {
  const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
  const ir = importOpenApiJson(openapi, sourceApp);
  return composeIrToNextJs("openapi-ir-nextjs", ir, outDir);
}

export function composeHarIrNextJs(harJsonPath: string, outDir: string, sourceApp?: string): ComposeResult {
  const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
  const ir = importHarJson(har, sourceApp);
  return composeIrToNextJs("har-ir-nextjs", ir, outDir);
}
