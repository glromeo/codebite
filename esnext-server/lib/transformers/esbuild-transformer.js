"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEsBuildTransformer = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const esbuild_1 = require("esbuild");
const esnext_web_modules_1 = require("esnext-web-modules");
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
exports.useEsBuildTransformer = pico_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImport } = esnext_web_modules_1.useWebModules(options);
    let esbuild;
    let setup = async () => {
        await es_module_lexer_1.init;
        return esbuild = await esbuild_1.startService();
    };
    async function esbuildTransformer(filename, content) {
        let { code, map } = await (esbuild || await setup()).transform(content, {
            sourcefile: filename,
            define: { "process.env.NODE_ENV": `"development"` },
            sourcemap: "inline",
            loader: "tsx"
        }).catch(reason => {
            console.error(reason);
        });
        if (!code) {
            throw new Error(`esbuild transformer failed to transform: ${filename}`);
        }
        let basedir = path_1.default.dirname(filename);
        let links = new Set();
        let [imports] = es_module_lexer_1.parse(code);
        let l = 0, rewritten = "";
        for (const { s, e, se } of imports) {
            if (se === 0) {
                continue;
            }
            let url = code.substring(s, e);
            let resolved = await resolveImport(url, basedir);
            if (resolved) {
                rewritten += code.substring(l, s);
                rewritten += resolved;
                links.add(resolved);
            }
            else {
                rewritten += code.substring(l, e);
                links.add(url);
            }
            l = e;
        }
        code = rewritten + code.substring(l);
        return {
            content: code,
            headers: {
                "content-type": mime_types_1.JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "esbuild-transformer"
            },
            map,
            links: [...links]
        };
    }
    return {
        esbuildTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMscUNBQXFDO0FBQ3JDLDJEQUFpRDtBQUNqRCxnRUFBbUM7QUFDbkMsZ0RBQXdCO0FBRXhCLG1EQUEyRDtBQUc5QyxRQUFBLHFCQUFxQixHQUFHLHNCQUFPLENBQUMsQ0FBQyxPQUFzQixFQUFFLGFBQWdDLE1BQU0sRUFBRSxFQUFFO0lBRTVHLE1BQU0sRUFBQyxhQUFhLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRS9DLElBQUksT0FBTyxDQUFDO0lBQ1osSUFBSSxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxzQkFBSSxDQUFDO1FBQ1gsT0FBTyxPQUFPLEdBQUcsTUFBTSxzQkFBWSxFQUFFLENBQUM7SUFDMUMsQ0FBQyxDQUFDO0lBRUYsS0FBSyxVQUFVLGtCQUFrQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTdELElBQUksRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLEtBQUssRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUNsRSxVQUFVLEVBQUUsUUFBUTtZQUNwQixNQUFNLEVBQUUsRUFBQyxzQkFBc0IsRUFBRSxlQUFlLEVBQUM7WUFDakQsU0FBUyxFQUFFLFFBQVE7WUFDbkIsTUFBTSxFQUFFLEtBQUs7U0FDaEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUMzRTtRQUVELElBQUksT0FBTyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2pELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRztZQUNILEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2aWNlfSBmcm9tIFwiZXNidWlsZFwiO1xyXG5pbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUVzQnVpbGRUcmFuc2Zvcm1lciA9IG1lbW9pemUoKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMsIHNvdXJjZU1hcHM6IFwiaW5saW5lXCIgfCBcImF1dG9cIiA9IFwiYXV0b1wiKSA9PiB7XHJcblxyXG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnR9ID0gdXNlV2ViTW9kdWxlcyhvcHRpb25zKTtcclxuXHJcbiAgICBsZXQgZXNidWlsZDtcclxuICAgIGxldCBzZXR1cCA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICBhd2FpdCBpbml0O1xyXG4gICAgICAgIHJldHVybiBlc2J1aWxkID0gYXdhaXQgc3RhcnRTZXJ2aWNlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGVzYnVpbGRUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG5cclxuICAgICAgICBsZXQge2NvZGUsIG1hcH0gPSBhd2FpdCAoZXNidWlsZCB8fCBhd2FpdCBzZXR1cCgpKS50cmFuc2Zvcm0oY29udGVudCwge1xyXG4gICAgICAgICAgICBzb3VyY2VmaWxlOiBmaWxlbmFtZSxcclxuICAgICAgICAgICAgZGVmaW5lOiB7XCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiBgXCJkZXZlbG9wbWVudFwiYH0sXHJcbiAgICAgICAgICAgIHNvdXJjZW1hcDogXCJpbmxpbmVcIixcclxuICAgICAgICAgICAgbG9hZGVyOiBcInRzeFwiXHJcbiAgICAgICAgfSkuY2F0Y2gocmVhc29uID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWNvZGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBlc2J1aWxkIHRyYW5zZm9ybWVyIGZhaWxlZCB0byB0cmFuc2Zvcm06ICR7ZmlsZW5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYmFzZWRpciA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XHJcbiAgICAgICAgbGV0IGxpbmtzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgbGV0IFtpbXBvcnRzXSA9IHBhcnNlKGNvZGUpO1xyXG4gICAgICAgIGxldCBsID0gMCwgcmV3cml0dGVuOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgICAgIGZvciAoY29uc3Qge3MsIGUsIHNlfSBvZiBpbXBvcnRzKSB7XHJcbiAgICAgICAgICAgIGlmIChzZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IHVybCA9IGNvZGUuc3Vic3RyaW5nKHMsIGUpO1xyXG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWQgPSBhd2FpdCByZXNvbHZlSW1wb3J0KHVybCwgYmFzZWRpcik7XHJcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IGNvZGUuc3Vic3RyaW5nKGwsIHMpO1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IHJlc29sdmVkO1xyXG4gICAgICAgICAgICAgICAgbGlua3MuYWRkKHJlc29sdmVkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSBjb2RlLnN1YnN0cmluZyhsLCBlKTtcclxuICAgICAgICAgICAgICAgIGxpbmtzLmFkZCh1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGwgPSBlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb2RlID0gcmV3cml0dGVuICsgY29kZS5zdWJzdHJpbmcobCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvZGUsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb2RlKSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImVzYnVpbGQtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYXAsXHJcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubGlua3NdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGVzYnVpbGRUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==