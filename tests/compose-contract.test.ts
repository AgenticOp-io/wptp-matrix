import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { composeOpenApiIrNextJs } from "../src/compose.js";
import { verifyComposedNextJsBronze } from "../src/verify-contract.js";

const fixtureOpenApi = join(import.meta.dirname, "..", "fixtures", "petstore-mini.openapi.json");
const tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("bronze contract verify (openapi-ir-nextjs)", () => {
  it("composes petstore-mini to Next.js route stubs", () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-compose-"));
    tempDirs.push(outDir);
    const compose = composeOpenApiIrNextJs(fixtureOpenApi, outDir);
    expect(compose.pathId).toBe("openapi-ir-nextjs");
    expect([...compose.filesWritten].sort()).toEqual(["app/pets/route.ts", "app/pets/{id}/route.ts"].sort());
    expect(compose.skippedEmit).toBe(0);

    const verify = verifyComposedNextJsBronze(outDir, compose, [
      { path: "/pets", method: "GET", file: "app/pets/route.ts" },
      { path: "/pets", method: "POST", file: "app/pets/route.ts" },
      { path: "/pets/{id}", method: "GET", file: "app/pets/{id}/route.ts" },
    ]);
    expect(verify.ok).toBe(true);
    expect(verify.checks.every((c) => c.ok)).toBe(true);

    const petsRoute = readFileSync(join(outDir, "app/pets/route.ts"), "utf8");
    expect(petsRoute).toContain("export async function GET()");
    expect(petsRoute).toContain("export async function POST()");
  });
});
