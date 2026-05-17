import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composeOpenApiIrHonoChrysalis } from "./compose-chrysalis-hono.js";
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
    const statusRun = spawnSync(process.execPath, [cli, "status", tinyBlog, "--json"], {
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
        const report = JSON.parse(statusRun.stdout);
        correctness =
            report.correctness?.percentage ?? report.summary?.correctnessPct ?? undefined;
        checks.push(`tiny-blog correctness=${correctness ?? "unknown"}%`);
    }
    catch {
        return { id, grade: "gold", ok: false, detail: "chrysalis status JSON parse failed" };
    }
    if (existsSync(emitScript)) {
        const matrixRoot = join(import.meta.dirname, "..");
        const openapiFixture = join(matrixRoot, "fixtures", "petstore-mini.openapi.json");
        if (existsSync(openapiFixture)) {
            const outDir = mkdtempSync(join(tmpdir(), "wptp-gold-"));
            try {
                const webir = composeOpenApiIrHonoChrysalis(openapiFixture, outDir, { chrysalisRoot: root });
                checks.push(`webir-emit-hono ok=${webir.emitOk} handlers=${webir.handlerCount}`);
            }
            finally {
                rmSync(outDir, { recursive: true, force: true });
            }
        }
    }
    const ok = typeof correctness === "number" && correctness >= 100;
    return {
        id,
        grade: "gold",
        ok,
        detail: checks.join("; "),
    };
}
