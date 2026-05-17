import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ensureComposedFastifyDeps } from "./verify-fastify-bronze.js";
import { ensureComposedHonoDeps, irPathToFetchPath } from "./verify-hono-bronze.js";
export function loadContractReplaySpec(path) {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    if (!raw.schemaVersion || !Array.isArray(raw.cases)) {
        throw new Error(`invalid contract replay spec: ${path}`);
    }
    return raw;
}
function bodyMatches(actual, expected) {
    for (const [key, value] of Object.entries(expected)) {
        if (JSON.stringify(actual[key]) !== JSON.stringify(value))
            return false;
    }
    return true;
}
/** Replay contract cases against a composed Hono project (gold, no Chrysalis). */
export async function verifyComposedHonoContractReplay(outDir, spec) {
    const checks = [];
    try {
        ensureComposedHonoDeps(outDir);
        const { pathToFileURL } = await import("node:url");
        const mod = await import(pathToFileURL(join(outDir, "src/app.ts")).href);
        const app = mod.app;
        for (const c of spec.cases) {
            const url = `http://127.0.0.1${irPathToFetchPath(c.path)}`;
            const init = { method: c.method };
            if (c.requestBody) {
                init.headers = { "content-type": "application/json" };
                init.body = JSON.stringify(c.requestBody);
            }
            const res = await app.fetch(new Request(url, init));
            checks.push({
                name: `replay ${c.method} ${c.path} status`,
                ok: res.status === c.status,
                detail: `${res.status} expected ${c.status}`,
            });
            if (c.body && res.status !== 204) {
                const body = (await res.json());
                checks.push({
                    name: `replay ${c.method} ${c.path} body`,
                    ok: bodyMatches(body, c.body),
                });
                if (c.requestBody) {
                    checks.push({
                        name: `replay ${c.method} ${c.path} echoed body`,
                        ok: JSON.stringify(body.body) === JSON.stringify(c.requestBody),
                    });
                }
            }
        }
    }
    catch (e) {
        checks.push({
            name: "replay import app",
            ok: false,
            detail: e instanceof Error ? e.message : String(e),
        });
    }
    return { ok: checks.every((x) => x.ok), checks };
}
/** Replay contract cases against a composed Fastify project (gold, no Chrysalis). */
export async function verifyComposedFastifyContractReplay(outDir, spec) {
    const checks = [];
    try {
        ensureComposedFastifyDeps(outDir);
        const { pathToFileURL } = await import("node:url");
        const mod = await import(pathToFileURL(join(outDir, "src/app.ts")).href);
        await mod.app.ready();
        for (const c of spec.cases) {
            const res = await mod.app.inject({
                method: c.method,
                url: irPathToFetchPath(c.path),
                payload: c.requestBody,
            });
            checks.push({
                name: `replay ${c.method} ${c.path} status`,
                ok: res.statusCode === c.status,
                detail: `${res.statusCode} expected ${c.status}`,
            });
            if (c.body && res.statusCode !== 204) {
                const body = res.json();
                checks.push({
                    name: `replay ${c.method} ${c.path} body`,
                    ok: bodyMatches(body, c.body),
                });
                if (c.requestBody) {
                    checks.push({
                        name: `replay ${c.method} ${c.path} echoed body`,
                        ok: JSON.stringify(body.body) === JSON.stringify(c.requestBody),
                    });
                }
            }
        }
    }
    catch (e) {
        checks.push({
            name: "replay import app",
            ok: false,
            detail: e instanceof Error ? e.message : String(e),
        });
    }
    return { ok: checks.every((x) => x.ok), checks };
}
