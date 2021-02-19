"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBabelTransformer = void 0;
const core_1 = require("@babel/core");
const esnext_web_modules_1 = require("esnext-web-modules");
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
exports.useBabelTransformer = pico_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImports, rewriteImports } = esnext_web_modules_1.useWebModulesPlugin(options);
    async function babelTransformer(filename, content) {
        const babelOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };
        const source = content;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSwyREFBdUQ7QUFDdkQsZ0VBQW1DO0FBQ25DLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxzQkFBTyxDQUFDLENBQUMsT0FBc0IsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUUxRyxNQUFNLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxHQUFHLHdDQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxRQUFlLEVBQUUsT0FBYztRQUUzRCxNQUFNLFlBQVksR0FBcUI7WUFDbkMsR0FBRyxPQUFPLENBQUMsS0FBSztZQUNoQixVQUFVLEVBQUUsVUFBVSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLFFBQVE7WUFDbkcsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsUUFBUTtTQUNyQixDQUFDO1FBRUYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLGdCQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ25ELE1BQU0sU0FBUyxHQUFHLE1BQU0sY0FBYyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUU1RCxJQUFJLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUMsR0FBRywyQkFBb0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFO1lBQ2hFLEdBQUcsWUFBWTtZQUNmLE9BQU8sRUFBRTtnQkFDTCxHQUFHLFlBQVksQ0FBQyxPQUFRO2dCQUN4QixDQUFDLGNBQWMsRUFBRSxFQUFDLFNBQVMsRUFBQyxDQUFDO2FBQ2hDO1NBQ0osQ0FBRSxDQUFDO1FBRUosSUFBSSxDQUFDLElBQUksRUFBRTtZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLEdBQUcsRUFBRTtZQUNMLElBQUksSUFBSSx5QkFBeUIsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQztTQUMxRTthQUFNO1lBQ0gsSUFBSSxJQUFJLElBQUksQ0FBQztTQUNoQjtRQUVELE9BQU87WUFDSCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsb0NBQXVCO2dCQUN2QyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztnQkFDekMsZUFBZSxFQUFFLG1CQUFtQjthQUN2QztZQUNELEdBQUc7WUFDSCxLQUFLLEVBQUUsQ0FBQyxHQUFHLFFBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxnQkFBZ0I7S0FDbkIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwYXJzZVN5bmMsIHRyYW5zZm9ybUZyb21Bc3RTeW5jLCBUcmFuc2Zvcm1PcHRpb25zfSBmcm9tIFwiQGJhYmVsL2NvcmVcIjtcclxuaW1wb3J0IHt1c2VXZWJNb2R1bGVzUGx1Z2lufSBmcm9tIFwiZXNuZXh0LXdlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7SkFWQVNDUklQVF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VCYWJlbFRyYW5zZm9ybWVyID0gbWVtb2l6ZSgob3B0aW9uczogRVNOZXh0T3B0aW9ucywgc291cmNlTWFwczogXCJpbmxpbmVcIiB8IFwiYXV0b1wiID0gXCJhdXRvXCIpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydHMsIHJld3JpdGVJbXBvcnRzfSA9IHVzZVdlYk1vZHVsZXNQbHVnaW4ob3B0aW9ucyk7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gYmFiZWxUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBjb25zdCBiYWJlbE9wdGlvbnM6IFRyYW5zZm9ybU9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuYmFiZWwsXHJcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHNvdXJjZU1hcHMgPT09IFwiYXV0b1wiID8gb3B0aW9ucy5iYWJlbC5zb3VyY2VNYXBzIDogb3B0aW9ucy5iYWJlbC5zb3VyY2VNYXBzICYmIFwiaW5saW5lXCIsXHJcbiAgICAgICAgICAgIGJhYmVscmM6IHRydWUsXHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGNvbnRlbnQ7XHJcbiAgICAgICAgY29uc3QgcGFyc2VkQXN0ID0gcGFyc2VTeW5jKHNvdXJjZSwgYmFiZWxPcHRpb25zKSE7XHJcbiAgICAgICAgY29uc3QgaW1wb3J0TWFwID0gYXdhaXQgcmVzb2x2ZUltcG9ydHMoZmlsZW5hbWUsIHBhcnNlZEFzdCk7XHJcblxyXG4gICAgICAgIGxldCB7Y29kZSwgbWFwLCBtZXRhZGF0YX0gPSB0cmFuc2Zvcm1Gcm9tQXN0U3luYyhwYXJzZWRBc3QsIHNvdXJjZSwge1xyXG4gICAgICAgICAgICAuLi5iYWJlbE9wdGlvbnMsXHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgIC4uLmJhYmVsT3B0aW9ucy5wbHVnaW5zISxcclxuICAgICAgICAgICAgICAgIFtyZXdyaXRlSW1wb3J0cywge2ltcG9ydE1hcH1dXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KSE7XHJcblxyXG4gICAgICAgIGlmICghY29kZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhYmVsIHRyYW5zZm9ybWVyIGZhaWxlZCB0byB0cmFuc2Zvcm06ICR7ZmlsZW5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWFwKSB7XHJcbiAgICAgICAgICAgIGNvZGUgKz0gXCJcXG4vLyMgc291cmNlTWFwcGluZ1VSTD1cIiArIHBhdGguYmFzZW5hbWUoZmlsZW5hbWUpICsgXCIubWFwXFxuXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29kZSArPSBcIlxcblwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogY29kZSxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSkFWQVNDUklQVF9DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvZGUpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiYmFiZWwtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYXAsXHJcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubWV0YWRhdGEhW1wiaW1wb3J0c1wiXV1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmFiZWxUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==