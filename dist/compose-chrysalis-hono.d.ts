export type ComposeChrysalisHonoResult = {
    readonly bundlePath: string;
    readonly emitOk: boolean;
    readonly handlerCount: number;
};
/** Silver path: OpenAPI → IR → WebIR → Chrysalis emit-hono (lowering beyond bronze stubs). */
export declare function composeOpenApiIrHonoChrysalis(openapiJsonPath: string, outDir: string, options: {
    readonly sourceApp?: string;
    readonly chrysalisRoot: string;
}): ComposeChrysalisHonoResult;
/** Silver path: HAR → IR → WebIR → Chrysalis emit-hono. */
export declare function composeHarIrHonoChrysalis(harJsonPath: string, outDir: string, options: {
    readonly sourceApp?: string;
    readonly chrysalisRoot: string;
}): ComposeChrysalisHonoResult;
