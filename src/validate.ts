import type { CompatibilityMatrix, MatrixEdge } from "./types.js";
import { MATRIX_SCHEMA_VERSION } from "./types.js";

export class MatrixValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatrixValidationError";
  }
}

function assertGoldEvidence(edge: MatrixEdge): void {
  if (edge.grade !== "gold") return;
  if (edge.status !== "supported") {
    throw new MatrixValidationError(`edge ${edge.id}: gold requires status supported`);
  }
  const e = edge.evidence;
  if (!e?.harness) {
    throw new MatrixValidationError(`edge ${edge.id}: gold requires evidence.harness`);
  }
  if (!e.corpus && !e.ci) {
    throw new MatrixValidationError(`edge ${edge.id}: gold requires evidence.corpus or evidence.ci`);
  }
}

export function assertCompatibilityMatrix(value: unknown): asserts value is CompatibilityMatrix {
  if (!value || typeof value !== "object") throw new MatrixValidationError("matrix: expected object");
  const m = value as Record<string, unknown>;
  if (m.schemaVersion !== MATRIX_SCHEMA_VERSION) {
    throw new MatrixValidationError(`matrix: unsupported schemaVersion ${String(m.schemaVersion)}`);
  }
  if (typeof m.program !== "string") throw new MatrixValidationError("matrix: missing program");
  if (!Array.isArray(m.edges)) throw new MatrixValidationError("matrix: edges must be array");

  const ids = new Set<string>();
  for (const row of m.edges) {
    if (!row || typeof row !== "object") throw new MatrixValidationError("matrix: invalid edge");
    const e = row as MatrixEdge;
    if (typeof e.id !== "string" || !e.id.trim()) throw new MatrixValidationError("matrix: edge missing id");
    if (ids.has(e.id)) throw new MatrixValidationError(`matrix: duplicate edge id ${e.id}`);
    ids.add(e.id);
    if (!e.source?.family || !e.source?.component) {
      throw new MatrixValidationError(`edge ${e.id}: source.family and source.component required`);
    }
    if (!e.target?.family || !e.target?.component) {
      throw new MatrixValidationError(`edge ${e.id}: target.family and target.component required`);
    }
    if (!["gold", "silver", "bronze"].includes(e.grade)) {
      throw new MatrixValidationError(`edge ${e.id}: invalid grade`);
    }
    if (!["supported", "planned", "deprecated"].includes(e.status)) {
      throw new MatrixValidationError(`edge ${e.id}: invalid status`);
    }
    if (e.grade === "gold" && e.status === "planned") {
      throw new MatrixValidationError(`edge ${e.id}: planned edges cannot be gold`);
    }
    assertGoldEvidence(e);
  }
}
