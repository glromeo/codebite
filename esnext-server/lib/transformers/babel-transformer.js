"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBabelTransformer = void 0;
const core_1 = require("@babel/core");
const esnext_web_modules_1 = require("esnext-web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
exports.useBabelTransformer = nano_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImports, rewriteImports } = esnext_web_modules_1.useWebModulesPlugin(options);
    const preProcess = options.transform && options.transform.preProcess;
    async function babelTransformer(filename, content) {
        const babelOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };
        const source = preProcess ? preProcess(filename, content) : content;
        const parsedAst = core_1.parseSync(source, babelOptions);
        const importMap = await resolveImports(filename, parsedAst);
        let { code, map, metadata } = core_1.transformFromAstSync(parsedAst, source, {
            ...babelOptions,
            plugins: [
                ...babelOptions.plugins,
                [rewriteImports, { importMap }]
            ]
        });
        if (!code) {
            throw new Error(`Babel transformer failed to transform: ${filename}`);
        }
        if (map) {
            code += "\n//# sourceMappingURL=" + path_1.default.basename(filename) + ".map\n";
        }
        else {
            code += "\n";
        }
        return {
            content: code,
            headers: {
                "content-type": mime_types_1.JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "babel-transformer"
            },
            map,
            links: [...metadata["imports"]]
        };
    }
    return {
        babelTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSwyREFBdUQ7QUFDdkQsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBc0IsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUUzRyxNQUFNLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxHQUFHLHdDQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFFckUsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTNELE1BQU0sWUFBWSxHQUFxQjtZQUNuQyxHQUFHLE9BQU8sQ0FBQyxLQUFLO1lBQ2hCLFVBQVUsRUFBRSxVQUFVLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksUUFBUTtZQUNuRyxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNwRSxNQUFNLFNBQVMsR0FBRyxnQkFBUyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFNUQsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDLEdBQUcsMkJBQW9CLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRTtZQUNoRSxHQUFHLFlBQVk7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsR0FBRyxZQUFZLENBQUMsT0FBUTtnQkFDeEIsQ0FBQyxjQUFjLEVBQUUsRUFBQyxTQUFTLEVBQUMsQ0FBQzthQUNoQztTQUNKLENBQUUsQ0FBQztRQUVKLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsSUFBSSxHQUFHLEVBQUU7WUFDTCxJQUFJLElBQUkseUJBQXlCLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDMUU7YUFBTTtZQUNILElBQUksSUFBSSxJQUFJLENBQUM7U0FDaEI7UUFFRCxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLG9DQUF1QjtnQkFDdkMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxtQkFBbUI7YUFDdkM7WUFDRCxHQUFHO1lBQ0gsS0FBSyxFQUFFLENBQUMsR0FBRyxRQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkMsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cGFyc2VTeW5jLCB0cmFuc2Zvcm1Gcm9tQXN0U3luYywgVHJhbnNmb3JtT3B0aW9uc30gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc1BsdWdpbn0gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUJhYmVsVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogRVNOZXh0T3B0aW9ucywgc291cmNlTWFwczogXCJpbmxpbmVcIiB8IFwiYXV0b1wiID0gXCJhdXRvXCIpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydHMsIHJld3JpdGVJbXBvcnRzfSA9IHVzZVdlYk1vZHVsZXNQbHVnaW4ob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3QgcHJlUHJvY2VzcyA9IG9wdGlvbnMudHJhbnNmb3JtICYmIG9wdGlvbnMudHJhbnNmb3JtLnByZVByb2Nlc3M7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gYmFiZWxUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBjb25zdCBiYWJlbE9wdGlvbnM6IFRyYW5zZm9ybU9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuYmFiZWwsXHJcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHNvdXJjZU1hcHMgPT09IFwiYXV0b1wiID8gb3B0aW9ucy5iYWJlbC5zb3VyY2VNYXBzIDogb3B0aW9ucy5iYWJlbC5zb3VyY2VNYXBzICYmIFwiaW5saW5lXCIsXHJcbiAgICAgICAgICAgIGJhYmVscmM6IHRydWUsXHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IHByZVByb2Nlc3MgPyBwcmVQcm9jZXNzKGZpbGVuYW1lLCBjb250ZW50KSA6IGNvbnRlbnQ7XHJcbiAgICAgICAgY29uc3QgcGFyc2VkQXN0ID0gcGFyc2VTeW5jKHNvdXJjZSwgYmFiZWxPcHRpb25zKSE7XHJcbiAgICAgICAgY29uc3QgaW1wb3J0TWFwID0gYXdhaXQgcmVzb2x2ZUltcG9ydHMoZmlsZW5hbWUsIHBhcnNlZEFzdCk7XHJcblxyXG4gICAgICAgIGxldCB7Y29kZSwgbWFwLCBtZXRhZGF0YX0gPSB0cmFuc2Zvcm1Gcm9tQXN0U3luYyhwYXJzZWRBc3QsIHNvdXJjZSwge1xyXG4gICAgICAgICAgICAuLi5iYWJlbE9wdGlvbnMsXHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgIC4uLmJhYmVsT3B0aW9ucy5wbHVnaW5zISxcclxuICAgICAgICAgICAgICAgIFtyZXdyaXRlSW1wb3J0cywge2ltcG9ydE1hcH1dXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KSE7XHJcblxyXG4gICAgICAgIGlmICghY29kZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhYmVsIHRyYW5zZm9ybWVyIGZhaWxlZCB0byB0cmFuc2Zvcm06ICR7ZmlsZW5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWFwKSB7XHJcbiAgICAgICAgICAgIGNvZGUgKz0gXCJcXG4vLyMgc291cmNlTWFwcGluZ1VSTD1cIiArIHBhdGguYmFzZW5hbWUoZmlsZW5hbWUpICsgXCIubWFwXFxuXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29kZSArPSBcIlxcblwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogY29kZSxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSkFWQVNDUklQVF9DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvZGUpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiYmFiZWwtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYXAsXHJcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubWV0YWRhdGEhW1wiaW1wb3J0c1wiXV1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmFiZWxUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==