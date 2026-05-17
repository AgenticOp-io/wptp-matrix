import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
export function verifyComposedHonoBronze(outDir, compose, expectedHandlers) {
    const checks = [];
    checks.push({
        name: "compose produced files",
        ok: compose.filesWritten.length > 0,
        detail: `files=${compose.filesWritten.length}`,
    });
    checks.push({
        name: "no skipped emit roots",
        ok: compose.skippedEmit === 0,
        detail: `skipped=${compose.skippedEmit}`,
    });
    checks.push({
        name: "package.json emitted",
        ok: existsSync(join(outDir, "package.json")),
    });
    checks.push({
        name: "src/app.ts emitted",
        ok: existsSync(join(outDir, "src/app.ts")),
    });
    checks.push({
        name: "handler count",
        ok: compose.handlerNames.length >= expectedHandlers.length,
        detail: `handlers=${compose.handlerNames.length}`,
    });
    for (const name of expectedHandlers) {
        const handlerFile = join(outDir, "src", "handlers", `${name}.ts`);
        const ok = existsSync(handlerFile);
        checks.push({ name: `handler file: ${name}`, ok });
        if (ok) {
            const src = readFileSync(handlerFile, "utf8");
            checks.push({
                name: `${name} uses c.json stub`,
                ok: src.includes("return c.json") && src.includes("route"),
            });
        }
    }
    const ok = checks.every((c) => c.ok);
    return { ok, checks };
}
/** IR/OpenAPI `{id}` segments → concrete path for Hono `app.fetch`. */
export function irPathToFetchPath(path) {
    return path.replace(/\{[^}]+\}/g, "1");
}
/** Install emitted package.json deps so `import "hono"` resolves under outDir. */
export function ensureComposedHonoDeps(outDir) {
    const pkg = join(outDir, "package.json");
    if (!existsSync(pkg))
        return;
    if (existsSync(join(outDir, "node_modules", "hono")))
        return;
    execSync("npm install --ignore-scripts --no-audit --no-fund", {
        cwd: outDir,
        stdio: "pipe",
    });
}
/** Runtime smoke: app.fetch returns JSON stub bodies (no server process). */
export async function verifyComposedHonoRuntime(outDir, routes) {
    const checks = [];
    try {
        ensureComposedHonoDeps(outDir);
        const mod = await import(pathToFileURL(join(outDir, "src/app.ts")).href);
        const app = mod.app;
        for (const route of routes) {
            const expectedStatus = route.status ?? (route.method.toUpperCase() === "POST" ? 201 : 200);
            const fetchPath = irPathToFetchPath(route.path);
            const url = `http://127.0.0.1${fetchPath}`;
            const init = { method: route.method };
            if (["POST", "PUT", "PATCH"].includes(route.method.toUpperCase())) {
                init.headers = { "content-type": "application/json" };
                init.body = JSON.stringify({ probe: true });
            }
            const res = await app.fetch(new Request(url, init));
            checks.push({
                name: `runtime ${route.method} ${route.path} status`,
                ok: res.status === expectedStatus,
                detail: `${res.status} (expected ${expectedStatus})`,
            });
            if (expectedStatus === 204)
                continue;
            const body = (await res.json());
            checks.push({
                name: `runtime ${route.method} ${route.path} body`,
                ok: body.ok === true && body.route === route.path,
            });
        }
    }
    catch (e) {
        checks.push({
            name: "runtime import app",
            ok: false,
            detail: e instanceof Error ? e.message : String(e),
        });
    }
    return { ok: checks.every((c) => c.ok), checks };
}
