"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEsBuildTransformer = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const esbuild_1 = __importDefault(require("esbuild"));
const esnext_web_modules_1 = require("esnext-web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const mime_types_1 = require("../util/mime-types");
exports.useEsBuildTransformer = (0, nano_memoize_1.default)((options, sourceMaps = "auto") => {
    const { resolveImport } = (0, esnext_web_modules_1.useWebModules)(options);
    async function esbuildTransformer(filename, content) {
        await es_module_lexer_1.init;
        let { code, map } = await esbuild_1.default.transform(content, {
            sourcefile: filename,
            define: { "process.env.NODE_ENV": `"development"` },
            sourcemap: "inline",
            loader: "tsx"
        }).catch(reason => {
            console.error(reason);
            return { code: undefined, map: "{}" };
        });
        if (!code) {
            throw new Error(`esbuild transformer failed to transform: ${filename}`);
        }
        let links = new Set();
        let [imports] = (0, es_module_lexer_1.parse)(code);
        let l = 0, rewritten = "";
        for (const { s, e, se } of imports) {
            if (se === 0) {
                continue;
            }
            let url = code.substring(s, e);
            let resolved = await resolveImport(url, filename);
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
            map: JSON.parse(map),
            links: [...links]
        };
    }
    return {
        esbuildTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMsc0RBQThCO0FBQzlCLDJEQUFpRDtBQUNqRCxnRUFBb0M7QUFHcEMsbURBQTJEO0FBRzlDLFFBQUEscUJBQXFCLEdBQUcsSUFBQSxzQkFBUSxFQUFDLENBQUMsT0FBc0IsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUU3RyxNQUFNLEVBQUMsYUFBYSxFQUFDLEdBQUcsSUFBQSxrQ0FBYSxFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRS9DLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxRQUFlLEVBQUUsT0FBYztRQUU3RCxNQUFNLHNCQUFJLENBQUM7UUFFWCxJQUFJLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQyxHQUFHLE1BQU0saUJBQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQy9DLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLE1BQU0sRUFBRSxFQUFDLHNCQUFzQixFQUFFLGVBQWUsRUFBQztZQUNqRCxTQUFTLEVBQUUsUUFBUTtZQUNuQixNQUFNLEVBQUUsS0FBSztTQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixPQUFPLEVBQUMsSUFBSSxFQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUMzRTtRQUVELElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUEsdUJBQUssRUFBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1lBQ3BCLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XHJcbmltcG9ydCBlc2J1aWxkIGZyb20gXCJlc2J1aWxkXCI7XHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUVzQnVpbGRUcmFuc2Zvcm1lciA9IG1lbW9pemVkKChvcHRpb25zOiBFU05leHRPcHRpb25zLCBzb3VyY2VNYXBzOiBcImlubGluZVwiIHwgXCJhdXRvXCIgPSBcImF1dG9cIikgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0fSA9IHVzZVdlYk1vZHVsZXMob3B0aW9ucyk7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZXNidWlsZFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcblxyXG4gICAgICAgIGF3YWl0IGluaXQ7XHJcblxyXG4gICAgICAgIGxldCB7Y29kZSwgbWFwfSA9IGF3YWl0IGVzYnVpbGQudHJhbnNmb3JtKGNvbnRlbnQsIHtcclxuICAgICAgICAgICAgc291cmNlZmlsZTogZmlsZW5hbWUsXHJcbiAgICAgICAgICAgIGRlZmluZToge1wicHJvY2Vzcy5lbnYuTk9ERV9FTlZcIjogYFwiZGV2ZWxvcG1lbnRcImB9LFxyXG4gICAgICAgICAgICBzb3VyY2VtYXA6IFwiaW5saW5lXCIsXHJcbiAgICAgICAgICAgIGxvYWRlcjogXCJ0c3hcIlxyXG4gICAgICAgIH0pLmNhdGNoKHJlYXNvbiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVhc29uKTtcclxuICAgICAgICAgICAgcmV0dXJuIHtjb2RlOnVuZGVmaW5lZCwgbWFwOiBcInt9XCJ9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWNvZGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBlc2J1aWxkIHRyYW5zZm9ybWVyIGZhaWxlZCB0byB0cmFuc2Zvcm06ICR7ZmlsZW5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbGlua3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICBsZXQgW2ltcG9ydHNdID0gcGFyc2UoY29kZSk7XHJcbiAgICAgICAgbGV0IGwgPSAwLCByZXdyaXR0ZW46IHN0cmluZyA9IFwiXCI7XHJcbiAgICAgICAgZm9yIChjb25zdCB7cywgZSwgc2V9IG9mIGltcG9ydHMpIHtcclxuICAgICAgICAgICAgaWYgKHNlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgdXJsID0gY29kZS5zdWJzdHJpbmcocywgZSk7XHJcbiAgICAgICAgICAgIGxldCByZXNvbHZlZCA9IGF3YWl0IHJlc29sdmVJbXBvcnQodXJsLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IGNvZGUuc3Vic3RyaW5nKGwsIHMpO1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IHJlc29sdmVkO1xyXG4gICAgICAgICAgICAgICAgbGlua3MuYWRkKHJlc29sdmVkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSBjb2RlLnN1YnN0cmluZyhsLCBlKTtcclxuICAgICAgICAgICAgICAgIGxpbmtzLmFkZCh1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGwgPSBlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb2RlID0gcmV3cml0dGVuICsgY29kZS5zdWJzdHJpbmcobCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvZGUsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb2RlKSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImVzYnVpbGQtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtYXA6IEpTT04ucGFyc2UobWFwKSxcclxuICAgICAgICAgICAgbGlua3M6IFsuLi5saW5rc11cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZXNidWlsZFRyYW5zZm9ybWVyXHJcbiAgICB9O1xyXG59KTtcclxuIl19