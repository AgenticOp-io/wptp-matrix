export interface ComposeFastifyResult {
    readonly pathId: string;
    readonly filesWritten: ReadonlyArray<string>;
    readonly irNodeCount: number;
    readonly skippedEmit: number;
    readonly handlerNames: ReadonlyArray<string>;
}
export declare function composeOpenApiIrFastify(openapiJsonPath: string, outDir: string, sourceApp?: string): ComposeFastifyResult;
export declare function composeHarIrFastify(harJsonPath: string, outDir: string, sourceApp?: string): ComposeFastifyResult;
