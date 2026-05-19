import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { importHarJson } from "@wptp/adapter-browser";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { assertIrDocumentV0, exportIrToWebIrBundleV0, type IrDocumentV0 } from "@wptp/ir";

export type ComposeChrysalisHonoResult = {
  readonly bundlePath: string;
  readonly emitOk: boolean;
  readonly handlerCount: number;
};

function emitIrToChrysalisHono(
  ir: IrDocumentV0,
  outDir: string,
  chrysalisRoot: string,
  bundleBasename: string,
): ComposeChrysalisHonoResult {
  const bundle = exportIrToWebIrBundleV0(ir);
  const bundlePath = join(outDir, ".wptp", bundleBasename);
  mkdirSync(dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), "utf8");

  const script = join(chrysalisRoot, "scripts", "emit-webir-bundle-hono.mjs");
  const run = spawnSync(process.execPath, [script, "--bundle", bundlePath, "--out", outDir], {
    encoding: "utf8",
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

/** Silver path: OpenAPI → IR → WebIR → Chrysalis emit-hono (lowering beyond bronze stubs). */
export function composeOpenApiIrHonoChrysalis(
  openapiJsonPath: string,
  outDir: string,
  options: { readonly sourceApp?: string; readonly chrysalisRoot: string },
): ComposeChrysalisHonoResult {
  const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
  const ir = importOpenApiJson(openapi, options.sourceApp);
  assertIrDocumentV0(ir);
  return emitIrToChrysalisHono(ir, outDir, options.chrysalisRoot, "petstore.webir.bundle.json");
}

/** Silver path: HAR → IR → WebIR → Chrysalis emit-hono. */
export function composeHarIrHonoChrysalis(
  harJsonPath: string,
  outDir: string,
  options: { readonly sourceApp?: string; readonly chrysalisRoot: string },
): ComposeChrysalisHonoResult {
  const har = JSON.parse(readFileSync(harJsonPath, "utf8"));
  const ir = importHarJson(har, options.sourceApp);
  assertIrDocumentV0(ir);
  return emitIrToChrysalisHono(ir, outDir, options.chrysalisRoot, "har.webir.bundle.json");
}
