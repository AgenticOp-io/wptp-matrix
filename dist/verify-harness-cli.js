#!/usr/bin/env node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { harnessSummary, runMatrixHarness } from "./verify-harness.js";
const fixtureRoot = join(import.meta.dirname, "..", "fixtures");
const outDir = mkdtempSync(join(tmpdir(), "wptp-harness-"));
try {
    const results = await runMatrixHarness({ fixtureRoot, outDir });
    const summary = harnessSummary(results);
    console.log(JSON.stringify({ ok: summary.ok, results }, null, 2));
    if (!summary.ok) {
        process.stderr.write(`harness failed: ${summary.failed.join(", ")}\n`);
        process.exit(1);
    }
}
finally {
    rmSync(outDir, { recursive: true, force: true });
}
