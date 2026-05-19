import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertIrDocumentV0, importWebIrBundleJson, summarizeLosses } from "@wptp/ir";
import type { ComposeResult } from "./compose.js";
import { composeHarIrNextJs, composeOpenApiIrNextJs } from "./compose.js";
import {
  composeHarIrFastify,
  composeOpenApiIrFastify,
  type ComposeFastifyResult,
} from "./compose-fastify.js";
import { composeHarIrHono, composeOpenApiIrHono, type ComposeHonoResult } from "./compose-hono.js";
import { verifyComposedFastifyBronze, verifyComposedFastifyRuntime } from "./verify-fastify-bronze.js";
import { verifyComposedHonoBronze, verifyComposedHonoRuntime } from "./verify-hono-bronze.js";
import { runOptionalGoldPhpWebirHono } from "./verify-gold-chrysalis.js";
import { runSilverHarIrHonoChrysalis, runSilverOpenApiIrHonoChrysalis } from "./verify-silver-chrysalis.js";
import {
  loadContractReplaySpec,
  verifyComposedFastifyContractReplay,
  verifyComposedHonoContractReplay,
} from "./verify-replay.js";
import { verifyComposedNextJsBronze, type ContractVerifyResult } from "./verify-contract.js";

export type HarnessGrade = "bronze" | "silver" | "gold";

export interface HarnessCase {
  readonly id: string;
  readonly grade: HarnessGrade;
  readonly description: string;
}

export interface HarnessRunResult {
  readonly id: string;
  readonly grade: HarnessGrade;
  readonly ok: boolean;
  readonly detail?: string;
  readonly contract?: ContractVerifyResult;
}

const OPENAPI_ROUTES = [
  { path: "/pets", method: "GET", file: "app/pets/route.ts" },
  { path: "/pets", method: "POST", file: "app/pets/route.ts" },
  { path: "/pets/{id}", method: "GET", file: "app/pets/{id}/route.ts" },
] as const;

const HAR_ROUTES = [
  { path: "/api/pets", method: "GET", file: "app/api/pets/route.ts" },
  { path: "/api/pets", method: "POST", file: "app/api/pets/route.ts" },
  { path: "/api/pets/42", method: "GET", file: "app/api/pets/42/route.ts" },
] as const;

/** Normative harness catalog (grades align with MASTER-PROGRAM §7). */
export const HARNESS_CASES: ReadonlyArray<HarnessCase> = [
  { id: "openapi-ir-nextjs", grade: "bronze", description: "OpenAPI → IR → Next.js contract stubs" },
  { id: "har-ir-nextjs", grade: "bronze", description: "HAR → IR → Next.js contract stubs" },
  { id: "webir-neutral-ir", grade: "silver", description: "Chrysalis WebIR bundle → IR v0 (loss report)" },
  { id: "openapi-ir-hono", grade: "bronze", description: "OpenAPI → IR → @wptp/emit-hono stubs (runtime JSON)" },
  { id: "har-ir-hono", grade: "bronze", description: "HAR → IR → @wptp/emit-hono stubs (runtime JSON)" },
  { id: "openapi-ir-fastify", grade: "bronze", description: "OpenAPI → IR → @wptp/emit-fastify stubs" },
  { id: "har-ir-fastify", grade: "bronze", description: "HAR → IR → @wptp/emit-fastify stubs" },
  {
    id: "openapi-ir-hono-contract-gold",
    grade: "gold",
    description: "OpenAPI composed Hono + contract replay (no Chrysalis)",
  },
  {
    id: "har-ir-hono-contract-gold",
    grade: "gold",
    description: "HAR composed Hono + contract replay (no Chrysalis)",
  },
  {
    id: "openapi-ir-fastify-contract-gold",
    grade: "gold",
    description: "OpenAPI composed Fastify + contract replay (no Chrysalis)",
  },
  {
    id: "har-ir-fastify-contract-gold",
    grade: "gold",
    description: "HAR composed Fastify + contract replay (no Chrysalis)",
  },
  {
    id: "openapi-ir-hono-chrysalis",
    grade: "silver",
    description: "OpenAPI → IR → WebIR → Chrysalis emit-hono (silver lowering)",
  },
  {
    id: "har-ir-hono-chrysalis",
    grade: "silver",
    description: "HAR → IR → WebIR → Chrysalis emit-hono (silver lowering)",
  },
  { id: "php-webir-hono", grade: "gold", description: "Chrysalis ingest + emit-hono + verify (monolith CI)" },
];

function runBronzeCompose(
  id: string,
  composeFn: (input: string, outDir: string) => ComposeResult,
  inputPath: string,
  outDir: string,
  routes: ReadonlyArray<{ path: string; method: string; file: string }>,
): HarnessRunResult {
  const compose = composeFn(inputPath, outDir);
  const contract = verifyComposedNextJsBronze(outDir, compose, routes);
  return {
    id,
    grade: "bronze",
    ok: contract.ok,
    detail: `files=${compose.filesWritten.length} skipped=${compose.skippedEmit}`,
    contract,
  };
}

async function runBronzeHonoCompose(
  id: string,
  composeFn: (input: string, outDir: string) => ComposeHonoResult,
  inputPath: string,
  outDir: string,
  runtimeRoutes: ReadonlyArray<{ readonly method: string; readonly path: string; readonly status?: number }>,
): Promise<HarnessRunResult> {
  const compose = composeFn(inputPath, outDir);
  const contract = verifyComposedHonoBronze(outDir, compose, compose.handlerNames);
  const runtime = await verifyComposedHonoRuntime(outDir, runtimeRoutes);
  return {
    id,
    grade: "bronze",
    ok: contract.ok && runtime.ok,
    detail: `handlers=${compose.handlerNames.length} runtime=${runtime.ok}`,
  };
}

async function runBronzeFastifyCompose(
  id: string,
  composeFn: (input: string, outDir: string) => ComposeFastifyResult,
  inputPath: string,
  outDir: string,
  runtimeRoutes: ReadonlyArray<{ readonly method: string; readonly path: string; readonly status?: number }>,
): Promise<HarnessRunResult> {
  const compose = composeFn(inputPath, outDir);
  const contract = verifyComposedFastifyBronze(outDir, compose, compose.handlerNames);
  const runtime = await verifyComposedFastifyRuntime(outDir, runtimeRoutes);
  return {
    id,
    grade: "bronze",
    ok: contract.ok && runtime.ok,
    detail: `handlers=${compose.handlerNames.length} runtime=${runtime.ok}`,
  };
}

async function runContractGoldHono(
  id: string,
  composeFn: (input: string, outDir: string) => ComposeHonoResult,
  inputPath: string,
  outDir: string,
  replayPath: string,
): Promise<HarnessRunResult> {
  const compose = composeFn(inputPath, outDir);
  const bronze = verifyComposedHonoBronze(outDir, compose, compose.handlerNames);
  const spec = loadContractReplaySpec(replayPath);
  const replay = await verifyComposedHonoContractReplay(outDir, spec);
  return {
    id,
    grade: "gold",
    ok: bronze.ok && replay.ok,
    detail: `bronze=${bronze.ok} replay=${replay.ok}`,
  };
}

async function runContractGoldFastify(
  id: string,
  composeFn: (input: string, outDir: string) => ComposeFastifyResult,
  inputPath: string,
  outDir: string,
  replayPath: string,
): Promise<HarnessRunResult> {
  const compose = composeFn(inputPath, outDir);
  const bronze = verifyComposedFastifyBronze(outDir, compose, compose.handlerNames);
  const spec = loadContractReplaySpec(replayPath);
  const replay = await verifyComposedFastifyContractReplay(outDir, spec);
  return {
    id,
    grade: "gold",
    ok: bronze.ok && replay.ok,
    detail: `bronze=${bronze.ok} replay=${replay.ok}`,
  };
}

function runSilverWebIrImport(bundlePath: string): HarnessRunResult {
  const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
  const doc = importWebIrBundleJson(bundle);
  assertIrDocumentV0(doc);
  const summary = summarizeLosses(doc);
  const ok = summary.lossCount === 0 && doc.nodes.length > 0;
  return {
    id: "webir-neutral-ir",
    grade: "silver",
    ok,
    detail: `nodes=${doc.nodes.length} losses=${summary.lossCount}`,
  };
}

/** Run in-repo harness cases (bronze compose + silver WebIR import). Gold runs in Chrysalis CI. */
export async function runMatrixHarness(options: {
  readonly fixtureRoot: string;
  readonly outDir: string;
}): Promise<ReadonlyArray<HarnessRunResult>> {
  const root = options.fixtureRoot;
  const results: HarnessRunResult[] = [];

  results.push(
    runBronzeCompose(
      "openapi-ir-nextjs",
      composeOpenApiIrNextJs,
      join(root, "petstore-mini.openapi.json"),
      join(options.outDir, "openapi-nextjs"),
      OPENAPI_ROUTES,
    ),
  );

  results.push(
    runBronzeCompose(
      "har-ir-nextjs",
      composeHarIrNextJs,
      join(root, "mini.har.json"),
      join(options.outDir, "har-nextjs"),
      HAR_ROUTES,
    ),
  );

  results.push(runSilverWebIrImport(join(root, "minimal-route.webir.bundle.json")));

  results.push(
    await runBronzeHonoCompose(
      "openapi-ir-hono",
      composeOpenApiIrHono,
      join(root, "petstore-mini.openapi.json"),
      join(options.outDir, "openapi-hono"),
      [
        { method: "GET", path: "/pets", status: 200 },
        { method: "POST", path: "/pets", status: 201 },
        { method: "GET", path: "/pets/{id}", status: 200 },
      ],
    ),
  );

  results.push(
    await runBronzeHonoCompose(
      "har-ir-hono",
      composeHarIrHono,
      join(root, "mini.har.json"),
      join(options.outDir, "har-hono"),
      [
        { method: "GET", path: "/api/pets" },
        { method: "POST", path: "/api/pets" },
        { method: "GET", path: "/api/pets/42" },
      ],
    ),
  );

  results.push(
    await runBronzeFastifyCompose(
      "openapi-ir-fastify",
      composeOpenApiIrFastify,
      join(root, "petstore-mini.openapi.json"),
      join(options.outDir, "openapi-fastify"),
      [
        { method: "GET", path: "/pets", status: 200 },
        { method: "POST", path: "/pets", status: 201 },
        { method: "GET", path: "/pets/{id}", status: 200 },
      ],
    ),
  );

  results.push(
    await runBronzeFastifyCompose(
      "har-ir-fastify",
      composeHarIrFastify,
      join(root, "mini.har.json"),
      join(options.outDir, "har-fastify"),
      [
        { method: "GET", path: "/api/pets", status: 200 },
        { method: "POST", path: "/api/pets", status: 201 },
        { method: "GET", path: "/api/pets/42", status: 200 },
      ],
    ),
  );

  const replayDir = join(root, "replay");

  results.push(
    await runContractGoldHono(
      "openapi-ir-hono-contract-gold",
      composeOpenApiIrHono,
      join(root, "petstore-mini.openapi.json"),
      join(options.outDir, "openapi-hono-gold"),
      join(replayDir, "petstore-openapi.replay.json"),
    ),
  );

  results.push(
    await runContractGoldHono(
      "har-ir-hono-contract-gold",
      composeHarIrHono,
      join(root, "mini.har.json"),
      join(options.outDir, "har-hono-gold"),
      join(replayDir, "mini-har.replay.json"),
    ),
  );

  results.push(
    await runContractGoldFastify(
      "openapi-ir-fastify-contract-gold",
      composeOpenApiIrFastify,
      join(root, "petstore-mini.openapi.json"),
      join(options.outDir, "openapi-fastify-gold"),
      join(replayDir, "petstore-openapi.replay.json"),
    ),
  );

  results.push(
    await runContractGoldFastify(
      "har-ir-fastify-contract-gold",
      composeHarIrFastify,
      join(root, "mini.har.json"),
      join(options.outDir, "har-fastify-gold"),
      join(replayDir, "mini-har.replay.json"),
    ),
  );

  results.push(
    runSilverOpenApiIrHonoChrysalis(
      join(root, "petstore-mini.openapi.json"),
      process.env.CHRYSALIS_ROOT,
    ),
  );
  results.push(runSilverHarIrHonoChrysalis(join(root, "mini.har.json"), process.env.CHRYSALIS_ROOT));

  results.push(runOptionalGoldPhpWebirHono(process.env.CHRYSALIS_ROOT));

  return results;
}

export function harnessSummary(results: ReadonlyArray<HarnessRunResult>): { ok: boolean; failed: string[] } {
  const failed = results
    .filter((r) => !r.ok && !r.detail?.startsWith("skipped"))
    .map((r) => r.id);
  return { ok: failed.length === 0, failed };
}
