export { MATRIX_SCHEMA_VERSION, type CompatibilityMatrix, type MatrixEdge, type MatrixEvidence, type PlatformRef, type VerificationGrade, } from "./types.js";
export { assertCompatibilityMatrix, MatrixValidationError } from "./validate.js";
export { composeHarIrNextJs, composeOpenApiIrNextJs, type ComposeResult } from "./compose.js";
export { composeHarIrHono, composeOpenApiIrHono, type ComposeHonoResult, } from "./compose-hono.js";
export { composeHarIrHonoChrysalis, composeOpenApiIrHonoChrysalis, type ComposeChrysalisHonoResult, } from "./compose-chrysalis-hono.js";
export { verifyComposedHonoBronze, verifyComposedHonoRuntime } from "./verify-hono-bronze.js";
export { verifyComposedNextJsBronze, type ContractCheck, type ContractVerifyResult, } from "./verify-contract.js";
export { HARNESS_CASES, harnessSummary, runMatrixHarness, type HarnessCase, type HarnessGrade, type HarnessRunResult, } from "./verify-harness.js";
