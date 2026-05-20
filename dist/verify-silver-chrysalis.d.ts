import type { HarnessRunResult } from "./verify-harness.js";
export declare function runSilverOpenApiIrHonoChrysalis(openapiPath: string, chrysalisRoot: string | undefined): HarnessRunResult;
export declare function runSilverHarIrHonoChrysalis(harPath: string, chrysalisRoot: string | undefined): HarnessRunResult;
export declare function runSilverOpenApiIrNextJsChrysalis(openapiPath: string, chrysalisRoot: string | undefined, wptpEmitNextJsRoot?: string): HarnessRunResult;
export declare function runSilverEchoApiIrNextJsChrysalis(openapiPath: string, chrysalisRoot: string | undefined, wptpEmitNextJsRoot?: string): HarnessRunResult;
export declare function runSilverHarIrNextJsChrysalis(harPath: string, chrysalisRoot: string | undefined, wptpEmitNextJsRoot?: string): HarnessRunResult;
