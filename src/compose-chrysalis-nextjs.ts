import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { importHarJson } from "@wptp/adapter-browser";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { assertIrDocumentV0, exportIrToWebIrBundleV0, type IrDocumentV0 } from "@wptp/ir";

export type ComposeChrysalisNextJsResult = {
  readonly bundlePath: string;
  readonly emitOk: boolean;
  readonly handlerCount: number;
};

function emitIrToChrysalisNextJs(
  ir: IrDocumentV0,
  outDir: string,
  chrysalisRoot: string,
  bundleBasename: string,
  wptpEmitNextJsRoot?: string,
): ComposeChrysalisNextJsResult {
  const bundle = exportIrToWebIrBundleV0(ir);
  const bundlePath = join(outDir, ".wptp", bundleBasename);
  mkdirSync(dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), "utf8");

  const script = join(chrysalisRoot, "scripts", "emit-webir-bundle-nextjs.mjs");
  const env = { ...process.env, ...(wptpEmitNextJsRoot ? { WPTP_EMIT_NEXTJS_ROOT: wptpEmitNextJsRoot } : {}) };
  const run = spawnSync(process.execPath, [script, "--bundle", bundlePath, "--out", outDir], {
    encoding: "utf8",
    env,
  });
  let handlerCount = 0;
  let emitOk = run.status === 0;
  if (emitOk) {
    try {
      const summary = JSON.parse(run.stdout.trim().split("\n").pop() ?? "{}");
      handlerCount = typeof summary.handlerCount === "number" ? summary.handlerCount : 0;
    } catch {
      handlerCount = bundle.module.roots.length;
    }
  }
  return { bundlePath, emitOk, handlerCount };
}

/** Silver path: OpenAPI → IR → WebIR bundle → Chrysalis loader + @wptp/emit-nextjs. */
export function composeOpenApiIrNextJsChrysalis(
  openapiJsonPath: string,
  outDir: string,
  options: { readonly sourceApp?: string; readonly chrysalisRoot: string; readonly wptpEmitNextJsRoot?: string },
): ComposeChrysalisNextJsResult {
  const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
  const ir = importOpenApiJson(openapi, options.sourceApp);
  assertIrDocumentV0(ir);
  return emitIrToChrysalisNextJs(ir, outDir, options.chrysalisRoot, "petstore.webir.bundle.json", options.wptpEmitNextJsRoot);
}

/** Silver path: HAR → IR → WebIR bundle → @wptp/emit-nextjs. */
export function composeHarIrNextJsChrysalis(
  harJsonPath: string,
  outDir: string,
  options: { readonly sourceApp?: string; readonly chrysalisRoot: string; readonly wptpEmitNextJsRoot?: string },
): ComposeChrysalisNextJsResult {
  const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
  const ir = importHarJson(har, options.sourceApp);
  assertIrDocumentV0(ir);
  return emitIrToChrysalisNextJs(ir, outDir, options.chrysalisRoot, "har.webir.bundle.json", options.wptpEmitNextJsRoot);
}
