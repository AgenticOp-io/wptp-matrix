import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertCompatibilityMatrix, MatrixValidationError } from "../src/index.js";

const matrixPath = join(import.meta.dirname, "..", "data", "matrix.v0.json");

describe("compatibility matrix v0", () => {
  it("validates committed matrix.v0.json", () => {
    const m = JSON.parse(readFileSync(matrixPath, "utf8"));
    assertCompatibilityMatrix(m);
    expect(m.edges.length).toBeGreaterThanOrEqual(6);
  });

  it("rejects gold without harness", () => {
    const m = JSON.parse(readFileSync(matrixPath, "utf8"));
    const bad = {
      ...m,
      edges: [
        {
          ...m.edges[0],
          evidence: { corpus: "x", ci: "y" },
        },
      ],
    };
    expect(() => assertCompatibilityMatrix(bad)).toThrow(MatrixValidationError);
  });
});
