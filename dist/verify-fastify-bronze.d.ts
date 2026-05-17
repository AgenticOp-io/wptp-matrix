import type { ComposeFastifyResult } from "./compose-fastify.js";
import type { ContractCheck } from "./verify-contract.js";
export declare function verifyComposedFastifyBronze(outDir: string, compose: ComposeFastifyResult, expectedHandlers: ReadonlyArray<string>): {
    ok: boolean;
    checks: ContractCheck[];
};
export declare function ensureComposedFastifyDeps(outDir: string): void;
/** Runtime smoke via Fastify inject. */
export declare function verifyComposedFastifyRuntime(outDir: string, routes: ReadonlyArray<{
    readonly method: string;
    readonly path: string;
    readonly status?: number;
}>): Promise<{
    ok: boolean;
    checks: ContractCheck[];
}>;
