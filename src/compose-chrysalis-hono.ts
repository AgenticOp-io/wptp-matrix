import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { importOpenApiJson } from "@wptp/adapter-openapi";
import { assertIrDocumentV0, exportIrToWebIrBundleV0 } from "@wptp/ir";

/** Optional path: OpenAPI → IR → WebIR → Chrysalis emit-hono (PHP-shaped lowering; not for bare contracts). */
export function composeOpenApiIrHonoChrysalis(
  openapiJsonPath: string,
  outDir: string,
  options: { readonly sourceApp?: string; readonly chrysalisRoot: string },
): {
  readonly bundlePath: string;
  readonly emitOk: boolean;
  readonly handlerCount: number;
} {
  const openapi = JSON.parse(readFileSync(openapiJsonPath, "utf8"));
  const ir = importOpenApiJson(openapi, options.sourceApp);
  assertIrDocumentV0(ir);
  const bundle = exportIrToWebIrBundleV0(ir);
  const bundlePath = join(outDir, ".wptp", "petstore.webir.bundle.json");
  mkdirSync(dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), "utf8");

  const script = join(options.chrysalisRoot, "scripts", "emit-webir-bundle-hono.mjs");
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
