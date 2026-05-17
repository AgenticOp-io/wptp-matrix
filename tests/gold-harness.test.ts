import { describe, expect, it } from "vitest";
import { runOptionalGoldPhpWebirHono } from "../src/verify-gold-chrysalis.js";

describe("optional gold harness", () => {
  it("skips php-webir-hono when CHRYSALIS_ROOT is unset", () => {
    const prev = process.env.CHRYSALIS_ROOT;
    delete process.env.CHRYSALIS_ROOT;
    const result = runOptionalGoldPhpWebirHono(undefined);
    if (prev !== undefined) process.env.CHRYSALIS_ROOT = prev;
    expect(result.id).toBe("php-webir-hono");
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("skipped");
  });
});
