export {
  MATRIX_SCHEMA_VERSION,
  type CompatibilityMatrix,
  type MatrixEdge,
  type MatrixEvidence,
  type PlatformRef,
  type VerificationGrade,
} from "./types.js";
export { assertCompatibilityMatrix, MatrixValidationError } from "./validate.js";
