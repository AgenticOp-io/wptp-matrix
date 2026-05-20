import type { HarnessRunResult } from "./verify-harness.js";
/** Map `chrysalis status --json` correctness to a 0–100 percentage. */
export declare function readCorrectnessPercentFromStatusJson(report: unknown): number | undefined;
/** Optional local gold smoke when Chrysalis is built (set CHRYSALIS_ROOT). */
export declare function runOptionalGoldPhpWebirHono(chrysalisRoot: string | undefined): HarnessRunResult;
