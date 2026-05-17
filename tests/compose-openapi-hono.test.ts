import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { composeOpenApiIrHono } from "../src/compose-hono.js";
import { verifyComposedHonoBronze, verifyComposedHonoRuntime } from "../src/verify-hono-bronze.js";

const fixtureOpenApi = join(import.meta.dirname, "..", "fixtures", "petstore-mini.openapi.json");
const tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("openapi-ir-hono compose (@wptp/emit-hono)", () => {
  it("emits bronze Hono stubs with runtime JSON", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-hono-"));
    tempDirs.push(outDir);
    const compose = composeOpenApiIrHono(fixtureOpenApi, outDir);
    expect(compose.pathId).toBe("openapi-ir-hono");
    expect(compose.skippedEmit).toBe(0);

    const verify = verifyComposedHonoBronze(outDir, compose, ["listPets", "createPet", "getPet"]);
    expect(verify.ok).toBe(true);

    const runtime = await verifyComposedHonoRuntime(outDir, [
      { method: "GET", path: "/pets" },
      { method: "GET", path: "/pets/{id}" },
    ]);
    expect(runtime.ok).toBe(true);
  });
});
