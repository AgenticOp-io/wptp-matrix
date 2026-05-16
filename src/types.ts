export const MATRIX_SCHEMA_VERSION = "0.1.0" as const;

export type VerificationGrade = "gold" | "silver" | "bronze";
export type EdgeStatus = "supported" | "planned" | "deprecated";

export interface PlatformRef {
  readonly family: string;
  readonly component: string;
  readonly repo?: string;
}

export interface MatrixEvidence {
  readonly corpus?: string;
  readonly ci?: string;
  readonly harness?: string;
  readonly notes?: string;
}

export interface MatrixEdge {
  readonly id: string;
  readonly source: PlatformRef;
  readonly target: PlatformRef;
  readonly grade: VerificationGrade;
  readonly status: EdgeStatus;
  readonly evidence?: MatrixEvidence;
  readonly irHub?: string;
}

export interface CompatibilityMatrix {
  readonly schemaVersion: typeof MATRIX_SCHEMA_VERSION;
  readonly program: string;
  readonly updatedAt: string;
  readonly edges: ReadonlyArray<MatrixEdge>;
}
