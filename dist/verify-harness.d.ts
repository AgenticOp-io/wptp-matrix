import { type ContractVerifyResult } from "./verify-contract.js";
export type HarnessGrade = "bronze" | "silver" | "gold";
export interface HarnessCase {
    readonly id: string;
    readonly grade: HarnessGrade;
    readonly description: string;
}
export interface HarnessRunResult {
    readonly id: string;
    readonly grade: HarnessGrade;
    readonly ok: boolean;
    readonly detail?: string;
    readonly contract?: ContractVerifyResult;
}
/** Normative harness catalog (grades align with MASTER-PROGRAM §7). */
export declare const HARNESS_CASES: ReadonlyArray<HarnessCase>;
/** Run in-repo harness cases (bronze compose + silver WebIR import). Gold runs in Chrysalis CI. */
export declare function runMatrixHarness(options: {
    readonly fixtureRoot: string;
    readonly outDir: string;
}): ReadonlyArray<HarnessRunResult>;
export declare function harnessSummary(results: ReadonlyArray<HarnessRunResult>): {
    ok: boolean;
    failed: string[];
};
