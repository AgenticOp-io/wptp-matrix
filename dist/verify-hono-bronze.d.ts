import type { ComposeHonoResult } from "./compose-hono.js";
import type { ContractCheck } from "./verify-contract.js";
export declare function verifyComposedHonoBronze(outDir: string, compose: ComposeHonoResult, expectedHandlers: ReadonlyArray<string>): {
    ok: boolean;
    checks: ContractCheck[];
};
/** IR/OpenAPI `{id}` segments → concrete path for Hono `app.fetch`. */
export declare function irPathToFetchPath(path: string): string;
/** Install emitted package.json deps so `import "hono"` resolves under outDir. */
export declare function ensureComposedHonoDeps(outDir: string): void;
/** Runtime smoke: app.fetch returns JSON stub bodies (no server process). */
export declare function verifyComposedHonoRuntime(outDir: string, routes: ReadonlyArray<{
    readonly method: string;
    readonly path: string;
}>): Promise<{
    ok: boolean;
    checks: ContractCheck[];
}>;
