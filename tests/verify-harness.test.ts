import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { harnessSummary, runMatrixHarness } from "../src/verify-harness.js";

const fixtureRoot = join(import.meta.dirname, "..", "fixtures");
const tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("matrix verify harness", () => {
  it("runs bronze compose + silver WebIR import cases", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-harness-"));
    tempDirs.push(outDir);
    const results = await runMatrixHarness({ fixtureRoot, outDir });
    const ids = results.map((r) => r.id).sort();
    expect(ids).toContain("har-ir-nextjs");
    expect(ids).toContain("har-ir-hono");
    expect(ids).toContain("openapi-ir-nextjs");
    expect(ids).toContain("openapi-ir-hono");
    expect(ids).toContain("webir-neutral-ir");
    const summary = harnessSummary(results);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
  });
});
