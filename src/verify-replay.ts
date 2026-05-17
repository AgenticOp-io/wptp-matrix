import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ContractCheck } from "./verify-contract.js";
import { ensureComposedFastifyDeps } from "./verify-fastify-bronze.js";
import { ensureComposedHonoDeps, irPathToFetchPath } from "./verify-hono-bronze.js";

export interface ContractReplayCase {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly body?: Readonly<Record<string, unknown>>;
  readonly requestBody?: Readonly<Record<string, unknown>>;
}

export interface ContractReplaySpec {
  readonly schemaVersion: string;
  readonly id: string;
  readonly cases: ReadonlyArray<ContractReplayCase>;
}

export function loadContractReplaySpec(path: string): ContractReplaySpec {
  const raw = JSON.parse(readFileSync(path, "utf8")) as ContractReplaySpec;
  if (!raw.schemaVersion || !Array.isArray(raw.cases)) {
    throw new Error(`invalid contract replay spec: ${path}`);
  }
  return raw;
}

function bodyMatches(
  actual: Record<string, unknown>,
  expected: Readonly<Record<string, unknown>>,
): boolean {
  for (const [key, value] of Object.entries(expected)) {
    if (JSON.stringify(actual[key]) !== JSON.stringify(value)) return false;
  }
  return true;
}

/** Replay contract cases against a composed Hono project (gold, no Chrysalis). */
export async function verifyComposedHonoContractReplay(
  outDir: string,
  spec: ContractReplaySpec,
): Promise<{ ok: boolean; checks: ContractCheck[] }> {
  const checks: ContractCheck[] = [];
  try {
    ensureComposedHonoDeps(outDir);
    const { pathToFileURL } = await import("node:url");
    const mod = await import(pathToFileURL(join(outDir, "src/app.ts")).href);
    const app = mod.app as { fetch: (req: Request) => Promise<Response> };
    for (const c of spec.cases) {
      const url = `http://127.0.0.1${irPathToFetchPath(c.path)}`;
      const init: RequestInit = { method: c.method };
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
        const body = (await res.json()) as Record<string, unknown>;
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
  } catch (e) {
    checks.push({
      name: "replay import app",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  return { ok: checks.every((x) => x.ok), checks };
}

/** Replay contract cases against a composed Fastify project (gold, no Chrysalis). */
export async function verifyComposedFastifyContractReplay(
  outDir: string,
  spec: ContractReplaySpec,
): Promise<{ ok: boolean; checks: ContractCheck[] }> {
  const checks: ContractCheck[] = [];
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
        const body = res.json() as Record<string, unknown>;
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
  } catch (e) {
    checks.push({
      name: "replay import app",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  return { ok: checks.every((x) => x.ok), checks };
}
