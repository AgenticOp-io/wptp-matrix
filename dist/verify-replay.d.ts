import type { ContractCheck } from "./verify-contract.js";
export interface ContractReplayCase {
    readonly method: string;
    readonly path: string;
    readonly status: number;
    readonly body?: Readonly<Record<string, unknown>>;
    readonly requestBody?: Readonly<Record<string, unknown>>;
}
export interface ContractReplaySpec {
    readonly schemaVersion: string;
    readonly id: string;
    readonly cases: ReadonlyArray<ContractReplayCase>;
}
export declare function loadContractReplaySpec(path: string): ContractReplaySpec;
/** Replay contract cases against a composed Hono project (gold, no Chrysalis). */
export declare function verifyComposedHonoContractReplay(outDir: string, spec: ContractReplaySpec): Promise<{
    ok: boolean;
    checks: ContractCheck[];
}>;
/** Replay contract cases against a composed Fastify project (gold, no Chrysalis). */
export declare function verifyComposedFastifyContractReplay(outDir: string, spec: ContractReplaySpec): Promise<{
    ok: boolean;
    checks: ContractCheck[];
}>;
