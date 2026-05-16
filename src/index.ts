export {
  MATRIX_SCHEMA_VERSION,
  type CompatibilityMatrix,
  type MatrixEdge,
  type MatrixEvidence,
  type PlatformRef,
  type VerificationGrade,
} from "./types.js";
export { assertCompatibilityMatrix, MatrixValidationError } from "./validate.js";
export { composeHarIrNextJs, composeOpenApiIrNextJs, type ComposeResult } from "./compose.js";
export {
  verifyComposedNextJsBronze,
  type ContractCheck,
  type ContractVerifyResult,
} from "./verify-contract.js";
export {
  HARNESS_CASES,
  harnessSummary,
  runMatrixHarness,
  type HarnessCase,
  type HarnessGrade,
  type HarnessRunResult,
} from "./verify-harness.js";
