export interface ComposeHonoResult {
    readonly pathId: string;
    readonly filesWritten: ReadonlyArray<string>;
    readonly irNodeCount: number;
    readonly skippedEmit: number;
    readonly handlerNames: ReadonlyArray<string>;
}
export declare function composeOpenApiIrHono(openapiJsonPath: string, outDir: string, sourceApp?: string): ComposeHonoResult;
export declare function composeHarIrHono(harJsonPath: string, outDir: string, sourceApp?: string): ComposeHonoResult;
