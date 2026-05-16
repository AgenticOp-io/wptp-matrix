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
  it("runs bronze compose + silver WebIR import cases", () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-harness-"));
    tempDirs.push(outDir);
    const results = runMatrixHarness({ fixtureRoot, outDir });
    expect(results.map((r) => r.id).sort()).toEqual(
      ["har-ir-nextjs", "openapi-ir-nextjs", "webir-neutral-ir"].sort(),
    );
    const summary = harnessSummary(results);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
  });
});
