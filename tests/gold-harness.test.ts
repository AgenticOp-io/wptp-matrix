import { describe, expect, it } from "vitest";
import {
  readCorrectnessPercentFromStatusJson,
  runOptionalGoldPhpWebirHono,
} from "../src/verify-gold-chrysalis.js";

describe("optional gold harness", () => {
  it("reads correctness.aggregate (0–1) from chrysalis status JSON", () => {
    expect(readCorrectnessPercentFromStatusJson({ correctness: { aggregate: 1 } })).toBe(100);
    expect(readCorrectnessPercentFromStatusJson({ migration: { correctness: 0.95 } })).toBe(95);
    expect(readCorrectnessPercentFromStatusJson({ correctness: { aggregate: 2 / 3 } })).toBeCloseTo(66.67, 1);
  });

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
