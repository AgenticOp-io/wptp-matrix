import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { composeHarIrNextJs } from "../src/compose.js";
import { verifyComposedNextJsBronze } from "../src/verify-contract.js";

const fixtureHar = join(import.meta.dirname, "..", "fixtures", "mini.har.json");
const tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("bronze contract verify (har-ir-nextjs)", () => {
  it("composes mini.har to Next.js route stubs", () => {
    const outDir = mkdtempSync(join(tmpdir(), "wptp-compose-har-"));
    tempDirs.push(outDir);
    const compose = composeHarIrNextJs(fixtureHar, outDir);
    expect(compose.pathId).toBe("har-ir-nextjs");
    expect([...compose.filesWritten].sort()).toEqual(
      ["app/api/pets/route.ts", "app/api/pets/42/route.ts"].sort(),
    );

    const verify = verifyComposedNextJsBronze(outDir, compose, [
      { path: "/api/pets", method: "GET", file: "app/api/pets/route.ts" },
      { path: "/api/pets", method: "POST", file: "app/api/pets/route.ts" },
      { path: "/api/pets/42", method: "GET", file: "app/api/pets/42/route.ts" },
    ]);
    expect(verify.ok).toBe(true);
  });
});
