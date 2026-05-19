import { describe, expect, it } from "vitest";
import { runSilverHarIrHonoChrysalis, runSilverOpenApiIrHonoChrysalis } from "../src/verify-silver-chrysalis.js";

describe("optional silver Chrysalis harness", () => {
  it("skips openapi-ir-hono-chrysalis when CHRYSALIS_ROOT is unset", () => {
    const prev = process.env.CHRYSALIS_ROOT;
    delete process.env.CHRYSALIS_ROOT;
    const result = runSilverOpenApiIrHonoChrysalis("fixtures/petstore-mini.openapi.json", undefined);
    if (prev !== undefined) process.env.CHRYSALIS_ROOT = prev;
    expect(result.id).toBe("openapi-ir-hono-chrysalis");
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("skipped");
  });

  it("skips har-ir-hono-chrysalis when CHRYSALIS_ROOT is unset", () => {
    const prev = process.env.CHRYSALIS_ROOT;
    delete process.env.CHRYSALIS_ROOT;
    const result = runSilverHarIrHonoChrysalis("fixtures/mini.har.json", undefined);
    if (prev !== undefined) process.env.CHRYSALIS_ROOT = prev;
    expect(result.id).toBe("har-ir-hono-chrysalis");
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("skipped");
  });
});
