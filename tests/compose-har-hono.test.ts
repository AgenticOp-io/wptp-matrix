import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { composeHarIrHono } from "../src/compose-hono.js";
import { verifyComposedHonoBronze, verifyComposedHonoRuntime } from "../src/verify-hono-bronze.js";

const fixtureHar = join(import.meta.dirname, "..", "fixtures", "mini.har.json");
const tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("har-ir-hono compose (@wptp/emit-hono)", () => {
  it("emits bronze Hono stubs with runtime JSON", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-har-hono-"));
    tempDirs.push(outDir);
    const compose = composeHarIrHono(fixtureHar, outDir);
    expect(compose.pathId).toBe("har-ir-hono");
    expect(compose.skippedEmit).toBe(0);
    expect(compose.handlerNames.length).toBe(3);

    const verify = verifyComposedHonoBronze(outDir, compose, compose.handlerNames);
    expect(verify.ok).toBe(true);

    const runtime = await verifyComposedHonoRuntime(outDir, [
      { method: "GET", path: "/api/pets" },
      { method: "POST", path: "/api/pets" },
      { method: "GET", path: "/api/pets/42" },
    ]);
    expect(runtime.ok).toBe(true);
  });
});
