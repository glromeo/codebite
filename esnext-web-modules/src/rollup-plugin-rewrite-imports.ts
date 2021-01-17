import {parse as parseEsm} from "es-module-lexer";
import * as path from "path";
import picomatch from "picomatch";
import resolve, {Opts} from "resolve";
import {OutputOptions, Plugin, RenderedChunk} from "rollup";
import {pathnameToModuleUrl, isBare, parseModuleUrl} from "./es-import-utils";
import {ImportMap, ImportResolver} from "./web-modules";

export type PluginRewriteImportsOptions = {
    importMap: ImportMap
    resolveImport: ImportResolver
    entryModules: Set<string>
    resolveOptions: Opts
    external?: string | string[]
}

const REWRITE_IMPORT = "rollup-plugin-rewrite-imports";

export function rollupPluginRewriteImports(options: PluginRewriteImportsOptions): Plugin {
    const {importMap, resolveImport, entryModules, resolveOptions} = options;
    const isExternal = options.external ? picomatch(options.external) : test => false;
    return {
        name: "rollup-plugin-rewrite-imports",
        async resolveId(source, importer) {
            if (importer && source.charCodeAt(0) !== 0) {
                if (isBare(source)) {
                    let [module] = parseModuleUrl(source);
                    if (module && entryModules.has(module) || entryModules.has(source)) {
                        return {id: source, external: true, meta: {[REWRITE_IMPORT]: await resolveImport(source)}};
                    }
                    if (isExternal(source)) {
                        let external = pathnameToModuleUrl(resolve.sync(source, resolveOptions));
                        if (external.indexOf("@babel/runtime/helpers") >= 0 && external.indexOf("/esm") === -1) {
                            // todo: is this even reached?
                            external = external.replace("/helpers", "/helpers/esm");
                        }
                        return {id: source, external: true, meta: {[REWRITE_IMPORT]: `/node_modules/${external}`}};
                    }
                } else {
                    let absolute = path.resolve(path.dirname(importer), source);
                    let moduleBareUrl = pathnameToModuleUrl(absolute);
                    let resolved = importMap.imports[moduleBareUrl];
                    if (resolved) {
                        let moduleInfo = this.getModuleInfo(source);
                        if (moduleInfo && !moduleInfo.isExternal) {
                            return moduleInfo.id;
                        }
                        return {id: source, external: true, meta: {[REWRITE_IMPORT]: resolved}};
                    }
                }
            }
            return null;
        },
        renderChunk(code: string, chunk: RenderedChunk, options: OutputOptions) {
            let [imports] = parseEsm(code);
            let l = 0, rewritten: string = "";
            for (const {s, e} of imports) {
                let url = code.substring(s, e);
                let resolved = this.getModuleInfo(url)?.meta[REWRITE_IMPORT];
                if (resolved) {
                    rewritten += code.substring(l, s);
                    rewritten += resolved;
                } else {
                    rewritten += code.substring(l, e);
                }
                l = e;
            }
            return {code: rewritten + code.substring(l), map: null};
        }
    };
}
