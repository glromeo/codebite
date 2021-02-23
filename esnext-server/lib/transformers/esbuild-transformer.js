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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMscUNBQXFDO0FBQ3JDLDJEQUFpRDtBQUNqRCxnRUFBbUM7QUFDbkMsZ0RBQXdCO0FBRXhCLG1EQUEyRDtBQUc5QyxRQUFBLHFCQUFxQixHQUFHLHNCQUFPLENBQUMsQ0FBQyxPQUFzQixFQUFFLGFBQWdDLE1BQU0sRUFBRSxFQUFFO0lBRTVHLE1BQU0sRUFBQyxhQUFhLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRS9DLElBQUksT0FBTyxDQUFDO0lBQ1osSUFBSSxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxzQkFBSSxDQUFDO1FBQ1gsT0FBTyxPQUFPLEdBQUcsTUFBTSxzQkFBWSxFQUFFLENBQUM7SUFDMUMsQ0FBQyxDQUFDO0lBRUYsS0FBSyxVQUFVLGtCQUFrQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTdELElBQUksRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLEtBQUssRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUNsRSxVQUFVLEVBQUUsUUFBUTtZQUNwQixNQUFNLEVBQUUsRUFBQyxzQkFBc0IsRUFBRSxlQUFlLEVBQUM7WUFDakQsU0FBUyxFQUFFLFFBQVE7WUFDbkIsTUFBTSxFQUFFLEtBQUs7U0FDaEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUMzRTtRQUVELElBQUksT0FBTyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2pELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRztZQUNILEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XG5pbXBvcnQge3N0YXJ0U2VydmljZX0gZnJvbSBcImVzYnVpbGRcIjtcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcblxuZXhwb3J0IGNvbnN0IHVzZUVzQnVpbGRUcmFuc2Zvcm1lciA9IG1lbW9pemUoKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMsIHNvdXJjZU1hcHM6IFwiaW5saW5lXCIgfCBcImF1dG9cIiA9IFwiYXV0b1wiKSA9PiB7XG5cbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKG9wdGlvbnMpO1xuXG4gICAgbGV0IGVzYnVpbGQ7XG4gICAgbGV0IHNldHVwID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBpbml0O1xuICAgICAgICByZXR1cm4gZXNidWlsZCA9IGF3YWl0IHN0YXJ0U2VydmljZSgpO1xuICAgIH07XG5cbiAgICBhc3luYyBmdW5jdGlvbiBlc2J1aWxkVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcblxuICAgICAgICBsZXQge2NvZGUsIG1hcH0gPSBhd2FpdCAoZXNidWlsZCB8fCBhd2FpdCBzZXR1cCgpKS50cmFuc2Zvcm0oY29udGVudCwge1xuICAgICAgICAgICAgc291cmNlZmlsZTogZmlsZW5hbWUsXG4gICAgICAgICAgICBkZWZpbmU6IHtcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6IGBcImRldmVsb3BtZW50XCJgfSxcbiAgICAgICAgICAgIHNvdXJjZW1hcDogXCJpbmxpbmVcIixcbiAgICAgICAgICAgIGxvYWRlcjogXCJ0c3hcIlxuICAgICAgICB9KS5jYXRjaChyZWFzb24gPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZWFzb24pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWNvZGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZXNidWlsZCB0cmFuc2Zvcm1lciBmYWlsZWQgdG8gdHJhbnNmb3JtOiAke2ZpbGVuYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGJhc2VkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZW5hbWUpO1xuICAgICAgICBsZXQgbGlua3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgbGV0IFtpbXBvcnRzXSA9IHBhcnNlKGNvZGUpO1xuICAgICAgICBsZXQgbCA9IDAsIHJld3JpdHRlbjogc3RyaW5nID0gXCJcIjtcbiAgICAgICAgZm9yIChjb25zdCB7cywgZSwgc2V9IG9mIGltcG9ydHMpIHtcbiAgICAgICAgICAgIGlmIChzZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHVybCA9IGNvZGUuc3Vic3RyaW5nKHMsIGUpO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkID0gYXdhaXQgcmVzb2x2ZUltcG9ydCh1cmwsIGJhc2VkaXIpO1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IGNvZGUuc3Vic3RyaW5nKGwsIHMpO1xuICAgICAgICAgICAgICAgIHJld3JpdHRlbiArPSByZXNvbHZlZDtcbiAgICAgICAgICAgICAgICBsaW5rcy5hZGQocmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXdyaXR0ZW4gKz0gY29kZS5zdWJzdHJpbmcobCwgZSk7XG4gICAgICAgICAgICAgICAgbGlua3MuYWRkKHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsID0gZTtcbiAgICAgICAgfVxuICAgICAgICBjb2RlID0gcmV3cml0dGVuICsgY29kZS5zdWJzdHJpbmcobCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvZGUsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSkFWQVNDUklQVF9DT05URU5UX1RZUEUsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb2RlKSxcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJlc2J1aWxkLXRyYW5zZm9ybWVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtYXAsXG4gICAgICAgICAgICBsaW5rczogWy4uLmxpbmtzXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGVzYnVpbGRUcmFuc2Zvcm1lclxuICAgIH07XG59KTtcbiJdfQ==