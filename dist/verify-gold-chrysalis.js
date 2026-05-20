import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composeOpenApiIrHonoChrysalis } from "./compose-chrysalis-hono.js";
/** Map `chrysalis status --json` correctness to a 0–100 percentage. */
export function readCorrectnessPercentFromStatusJson(report) {
    if (!report || typeof report !== "object")
        return undefined;
    const r = report;
    if (typeof r.correctness?.percentage === "number")
        return r.correctness.percentage;
    if (typeof r.summary?.correctnessPct === "number")
        return r.summary.correctnessPct;
    if (typeof r.correctness?.aggregate === "number") {
        const a = r.correctness.aggregate;
        return a <= 1 ? a * 100 : a;
    }
    if (typeof r.migration?.correctness === "number") {
        const m = r.migration.correctness;
        return m <= 1 ? m * 100 : m;
    }
    return undefined;
}
/** Optional local gold smoke when Chrysalis is built (set CHRYSALIS_ROOT). */
export function runOptionalGoldPhpWebirHono(chrysalisRoot) {
    const id = "php-webir-hono";
    if (!chrysalisRoot?.trim()) {
        return {
            id,
            grade: "gold",
            ok: true,
            detail: "skipped (set CHRYSALIS_ROOT for local Chrysalis gold smoke)",
        };
    }
    const root = chrysalisRoot.trim();
    const cli = join(root, "packages", "cli", "dist", "bin.js");
    const tinyBlog = join(root, "fixtures", "tiny-blog");
    const emitScript = join(root, "scripts", "emit-webir-bundle-hono.mjs");
    const checks = [];
    if (!existsSync(cli)) {
        return { id, grade: "gold", ok: false, detail: "missing packages/cli/dist/bin.js (run pnpm -r build)" };
    }
    if (!existsSync(tinyBlog)) {
        return { id, grade: "gold", ok: false, detail: "missing fixtures/tiny-blog" };
    }
    const traces = join(root, "traces");
    const report = join(root, "reports", "verify");
    const statusArgs = [cli, "status", tinyBlog, "--json", "--traces", traces, "--report", report];
    const statusRun = spawnSync(process.execPath, statusArgs, {
        cwd: root,
        encoding: "utf8",
        timeout: 300_000,
        env: { ...process.env },
    });
    if (statusRun.status !== 0) {
        return {
            id,
            grade: "gold",
            ok: false,
            detail: `chrysalis status failed (exit ${statusRun.status})`,
        };
    }
    let correctness;
    try {
        correctness = readCorrectnessPercentFromStatusJson(JSON.parse(statusRun.stdout));
        checks.push(`tiny-blog correctness=${correctness ?? "unknown"}%`);
    }
    catch {
        return { id, grade: "gold", ok: false, detail: "chrysalis status JSON parse failed" };
    }
    let emitOk = true;
    if (existsSync(emitScript)) {
        const matrixRoot = join(import.meta.dirname, "..");
        const openapiFixture = join(matrixRoot, "fixtures", "petstore-mini.openapi.json");
        if (existsSync(openapiFixture)) {
            const outDir = mkdtempSync(join(tmpdir(), "wptp-gold-"));
            try {
                const webir = composeOpenApiIrHonoChrysalis(openapiFixture, outDir, { chrysalisRoot: root });
                emitOk = webir.emitOk;
                checks.push(`webir-emit-hono ok=${webir.emitOk} handlers=${webir.handlerCount}`);
            }
            finally {
                rmSync(outDir, { recursive: true, force: true });
            }
        }
    }
    const minPct = Number(process.env.WPTP_PHP_WEBIR_MIN_CORRECTNESS_PCT ?? "100");
    const correctnessOk = typeof correctness === "number" && Number.isFinite(minPct) && correctness + 1e-9 >= minPct;
    const ok = emitOk && correctnessOk;
    return {
        id,
        grade: "gold",
        ok,
        detail: `${checks.join("; ")}; minCorrectnessPct=${minPct}`,
    };
}
