import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HarnessRunResult } from "./verify-harness.js";
import { composeHarIrHonoChrysalis, composeOpenApiIrHonoChrysalis } from "./compose-chrysalis-hono.js";
import { composeHarIrNextJsChrysalis, composeOpenApiIrNextJsChrysalis } from "./compose-chrysalis-nextjs.js";

function runSilverCompose(
  id: string,
  composeFn: (input: string, outDir: string, chrysalisRoot: string) => {
    readonly emitOk: boolean;
    readonly handlerCount: number;
  },
  inputPath: string,
  chrysalisRoot: string | undefined,
): HarnessRunResult {
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
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

export function runSilverOpenApiIrHonoChrysalis(
  openapiPath: string,
  chrysalisRoot: string | undefined,
): HarnessRunResult {
  return runSilverCompose(
    "openapi-ir-hono-chrysalis",
    (input, out, chrysalis) => composeOpenApiIrHonoChrysalis(input, out, { chrysalisRoot: chrysalis }),
    openapiPath,
    chrysalisRoot,
  );
}

export function runSilverHarIrHonoChrysalis(
  harPath: string,
  chrysalisRoot: string | undefined,
): HarnessRunResult {
  return runSilverCompose(
    "har-ir-hono-chrysalis",
    (input, out, chrysalis) => composeHarIrHonoChrysalis(input, out, { chrysalisRoot: chrysalis }),
    harPath,
    chrysalisRoot,
  );
}

export function runSilverEchoApiIrHonoChrysalis(
  openapiPath: string,
  chrysalisRoot: string | undefined,
): HarnessRunResult {
  return runSilverCompose(
    "echo-api-ir-hono-chrysalis",
    (input, out, chrysalis) => composeOpenApiIrHonoChrysalis(input, out, { chrysalisRoot: chrysalis }),
    openapiPath,
    chrysalisRoot,
  );
}

export function runSilverOpenApiIrNextJsChrysalis(
  openapiPath: string,
  chrysalisRoot: string | undefined,
  wptpEmitNextJsRoot?: string,
): HarnessRunResult {
  return runSilverCompose(
    "openapi-ir-nextjs-chrysalis",
    (input, out, chrysalis) =>
      composeOpenApiIrNextJsChrysalis(input, out, {
        chrysalisRoot: chrysalis,
        wptpEmitNextJsRoot: wptpEmitNextJsRoot,
      }),
    openapiPath,
    chrysalisRoot,
  );
}

export function runSilverEchoApiIrNextJsChrysalis(
  openapiPath: string,
  chrysalisRoot: string | undefined,
  wptpEmitNextJsRoot?: string,
): HarnessRunResult {
  return runSilverCompose(
    "echo-api-ir-nextjs-chrysalis",
    (input, out, chrysalis) =>
      composeOpenApiIrNextJsChrysalis(input, out, {
        chrysalisRoot: chrysalis,
        wptpEmitNextJsRoot: wptpEmitNextJsRoot,
      }),
    openapiPath,
    chrysalisRoot,
  );
}

export function runSilverHarIrNextJsChrysalis(
  harPath: string,
  chrysalisRoot: string | undefined,
  wptpEmitNextJsRoot?: string,
): HarnessRunResult {
  return runSilverCompose(
    "har-ir-nextjs-chrysalis",
    (input, out, chrysalis) =>
      composeHarIrNextJsChrysalis(input, out, {
        chrysalisRoot: chrysalis,
        wptpEmitNextJsRoot: wptpEmitNextJsRoot,
      }),
    harPath,
    chrysalisRoot,
  );
}
