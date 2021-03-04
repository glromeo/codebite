"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEsBuildTransformer = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const esbuild_1 = require("esbuild");
const esnext_web_modules_1 = require("esnext-web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const mime_types_1 = require("../util/mime-types");
exports.useEsBuildTransformer = nano_memoize_1.default((options, sourceMaps = "auto") => {
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
        let links = new Set();
        let [imports] = es_module_lexer_1.parse(code);
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
            map,
            links: [...links]
        };
    }
    return {
        esbuildTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvZXNidWlsZC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBNEM7QUFDNUMscUNBQXFDO0FBQ3JDLDJEQUFpRDtBQUNqRCxnRUFBb0M7QUFHcEMsbURBQTJEO0FBRzlDLFFBQUEscUJBQXFCLEdBQUcsc0JBQVEsQ0FBQyxDQUFDLE9BQXNCLEVBQUUsYUFBZ0MsTUFBTSxFQUFFLEVBQUU7SUFFN0csTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLGtDQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0MsSUFBSSxPQUFPLENBQUM7SUFDWixJQUFJLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLHNCQUFJLENBQUM7UUFDWCxPQUFPLE9BQU8sR0FBRyxNQUFNLHNCQUFZLEVBQUUsQ0FBQztJQUMxQyxDQUFDLENBQUM7SUFFRixLQUFLLFVBQVUsa0JBQWtCLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFFN0QsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUMsR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sS0FBSyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ2xFLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLE1BQU0sRUFBRSxFQUFDLHNCQUFzQixFQUFFLGVBQWUsRUFBQztZQUNqRCxTQUFTLEVBQUUsUUFBUTtZQUNuQixNQUFNLEVBQUUsS0FBSztTQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzNFO1FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLE9BQU8sRUFBRTtZQUM5QixJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1YsU0FBUzthQUNaO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksUUFBUSxFQUFFO2dCQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsU0FBUyxJQUFJLFFBQVEsQ0FBQztnQkFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN2QjtpQkFBTTtnQkFDSCxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEI7WUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckMsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxvQ0FBdUI7Z0JBQ3ZDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUscUJBQXFCO2FBQ3pDO1lBQ0QsR0FBRztZQUNILEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGtCQUFrQjtLQUNyQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luaXQsIHBhcnNlfSBmcm9tIFwiZXMtbW9kdWxlLWxleGVyXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2aWNlfSBmcm9tIFwiZXNidWlsZFwiO1xyXG5pbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7SkFWQVNDUklQVF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VFc0J1aWxkVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogRVNOZXh0T3B0aW9ucywgc291cmNlTWFwczogXCJpbmxpbmVcIiB8IFwiYXV0b1wiID0gXCJhdXRvXCIpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKG9wdGlvbnMpO1xyXG5cclxuICAgIGxldCBlc2J1aWxkO1xyXG4gICAgbGV0IHNldHVwID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGF3YWl0IGluaXQ7XHJcbiAgICAgICAgcmV0dXJuIGVzYnVpbGQgPSBhd2FpdCBzdGFydFNlcnZpY2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZXNidWlsZFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcblxyXG4gICAgICAgIGxldCB7Y29kZSwgbWFwfSA9IGF3YWl0IChlc2J1aWxkIHx8IGF3YWl0IHNldHVwKCkpLnRyYW5zZm9ybShjb250ZW50LCB7XHJcbiAgICAgICAgICAgIHNvdXJjZWZpbGU6IGZpbGVuYW1lLFxyXG4gICAgICAgICAgICBkZWZpbmU6IHtcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6IGBcImRldmVsb3BtZW50XCJgfSxcclxuICAgICAgICAgICAgc291cmNlbWFwOiBcImlubGluZVwiLFxyXG4gICAgICAgICAgICBsb2FkZXI6IFwidHN4XCJcclxuICAgICAgICB9KS5jYXRjaChyZWFzb24gPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICghY29kZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGVzYnVpbGQgdHJhbnNmb3JtZXIgZmFpbGVkIHRvIHRyYW5zZm9ybTogJHtmaWxlbmFtZX1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBsaW5rcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgIGxldCBbaW1wb3J0c10gPSBwYXJzZShjb2RlKTtcclxuICAgICAgICBsZXQgbCA9IDAsIHJld3JpdHRlbjogc3RyaW5nID0gXCJcIjtcclxuICAgICAgICBmb3IgKGNvbnN0IHtzLCBlLCBzZX0gb2YgaW1wb3J0cykge1xyXG4gICAgICAgICAgICBpZiAoc2UgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB1cmwgPSBjb2RlLnN1YnN0cmluZyhzLCBlKTtcclxuICAgICAgICAgICAgbGV0IHJlc29sdmVkID0gYXdhaXQgcmVzb2x2ZUltcG9ydCh1cmwsIGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHJlc29sdmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXdyaXR0ZW4gKz0gY29kZS5zdWJzdHJpbmcobCwgcyk7XHJcbiAgICAgICAgICAgICAgICByZXdyaXR0ZW4gKz0gcmVzb2x2ZWQ7XHJcbiAgICAgICAgICAgICAgICBsaW5rcy5hZGQocmVzb2x2ZWQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV3cml0dGVuICs9IGNvZGUuc3Vic3RyaW5nKGwsIGUpO1xyXG4gICAgICAgICAgICAgICAgbGlua3MuYWRkKHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbCA9IGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvZGUgPSByZXdyaXR0ZW4gKyBjb2RlLnN1YnN0cmluZyhsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogY29kZSxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSkFWQVNDUklQVF9DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvZGUpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiZXNidWlsZC10cmFuc2Zvcm1lclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1hcCxcclxuICAgICAgICAgICAgbGlua3M6IFsuLi5saW5rc11cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZXNidWlsZFRyYW5zZm9ybWVyXHJcbiAgICB9O1xyXG59KTtcclxuIl19