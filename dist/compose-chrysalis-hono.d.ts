/** Optional path: OpenAPI → IR → WebIR → Chrysalis emit-hono (PHP-shaped lowering; not for bare contracts). */
export declare function composeOpenApiIrHonoChrysalis(openapiJsonPath: string, outDir: string, options: {
    readonly sourceApp?: string;
    readonly chrysalisRoot: string;
}): {
    readonly bundlePath: string;
    readonly emitOk: boolean;
    readonly handlerCount: number;
};
