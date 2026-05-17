import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { composeOpenApiIrFastify } from "../src/compose-fastify.js";
import { verifyComposedFastifyRuntime } from "../src/verify-fastify-bronze.js";

const fixtureOpenApi = join(import.meta.dirname, "..", "fixtures", "petstore-mini.openapi.json");
const tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("openapi-ir-fastify compose (@wptp/emit-fastify)", () => {
  it("emits bronze Fastify stubs with runtime JSON", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-fastify-"));
    tempDirs.push(outDir);
    const compose = composeOpenApiIrFastify(fixtureOpenApi, outDir);
    expect(compose.pathId).toBe("openapi-ir-fastify");
    const runtime = await verifyComposedFastifyRuntime(outDir, [
      { method: "GET", path: "/pets", status: 200 },
      { method: "POST", path: "/pets", status: 201 },
    ]);
    expect(runtime.ok).toBe(true);
  });
});
