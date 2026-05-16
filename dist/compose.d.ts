export interface ComposeResult {
    readonly pathId: string;
    readonly filesWritten: ReadonlyArray<string>;
    readonly irNodeCount: number;
    readonly skippedEmit: number;
}
export declare function composeOpenApiIrNextJs(openapiJsonPath: string, outDir: string, sourceApp?: string): ComposeResult;
export declare function composeHarIrNextJs(harJsonPath: string, outDir: string, sourceApp?: string): ComposeResult;
