import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComposeFastifyResult } from "./compose-fastify.js";
import type { ContractCheck } from "./verify-contract.js";
import { irPathToFetchPath } from "./verify-hono-bronze.js";

export function verifyComposedFastifyBronze(
  outDir: string,
  compose: ComposeFastifyResult,
  expectedHandlers: ReadonlyArray<string>,
): { ok: boolean; checks: ContractCheck[] } {
  const checks: ContractCheck[] = [];
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

  for (const name of expectedHandlers) {
    const handlerFile = join(outDir, "src", "handlers", `${name}.ts`);
    const ok = existsSync(handlerFile);
    checks.push({ name: `handler file: ${name}`, ok });
    if (ok) {
      const src = readFileSync(handlerFile, "utf8");
      checks.push({
        name: `${name} uses reply.send stub`,
        ok: src.includes("reply.status") && src.includes("route"),
      });
    }
  }

  return { ok: checks.every((c) => c.ok), checks };
}

export function ensureComposedFastifyDeps(outDir: string): void {
  const pkg = join(outDir, "package.json");
  if (!existsSync(pkg)) return;
  if (existsSync(join(outDir, "node_modules", "fastify"))) return;
  execSync("npm install --ignore-scripts --no-audit --no-fund", {
    cwd: outDir,
    stdio: "pipe",
  });
}

/** Runtime smoke via Fastify inject. */
export async function verifyComposedFastifyRuntime(
  outDir: string,
  routes: ReadonlyArray<{ readonly method: string; readonly path: string; readonly status?: number }>,
): Promise<{ ok: boolean; checks: ContractCheck[] }> {
  const checks: ContractCheck[] = [];
  try {
    ensureComposedFastifyDeps(outDir);
    const { pathToFileURL } = await import("node:url");
    const mod = await import(pathToFileURL(join(outDir, "src/app.ts")).href);
    await mod.app.ready();
    for (const route of routes) {
      const expectedStatus = route.status ?? (route.method.toUpperCase() === "POST" ? 201 : 200);
      const res = await mod.app.inject({
        method: route.method,
        url: irPathToFetchPath(route.path),
        payload: ["POST", "PUT", "PATCH"].includes(route.method.toUpperCase()) ? { probe: true } : undefined,
      });
      checks.push({
        name: `runtime ${route.method} ${route.path} status`,
        ok: res.statusCode === expectedStatus,
        detail: String(res.statusCode),
      });
      if (expectedStatus !== 204) {
        const body = res.json() as { ok?: boolean; route?: string };
        checks.push({
          name: `runtime ${route.method} ${route.path} body`,
          ok: body.ok === true && body.route === route.path,
        });
      }
    }
  } catch (e) {
    checks.push({
      name: "runtime import app",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  return { ok: checks.every((c) => c.ok), checks };
}
