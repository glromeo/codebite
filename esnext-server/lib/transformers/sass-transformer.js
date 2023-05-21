"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassTransformer = void 0;
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const sass_1 = __importDefault(require("sass"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
const sass_importer_1 = require("../util/sass-importer");
const cssResultModule = cssText => `// [HMR] Update CSSResult
import {createHotContext} from "/esnext-server-client/lib/index.js"; 
import.meta.hot = createHotContext(import.meta.url);

import {css} from "/web_modules/lit-element.js";
const cssResult = css\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`;
export default cssResult; 

// Even new custom element instances would use the original cssResult instance

import.meta.hot.dispose(() => {
    return import.meta.hot.cssResult || cssResult;
});

import.meta.hot.accept(({module, recycled: cssResult}) => {
    import.meta.hot.cssResult = cssResult;
    cssResult.cssText = module.default.cssText;
    cssResult.styleSheet.replaceSync(module.default.cssText);
});
`;
const styleModule = cssText => `// [HMR] Reload Style
import {createHotContext} from "/esnext-server-client/lib/index.js"; 
import.meta.hot = createHotContext(import.meta.url);

const styleElement = document.createElement("style");
document.head
    .appendChild(styleElement)
    .appendChild(document.createTextNode(\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`));

import.meta.hot.dispose(() => document.head.removeChild(styleElement));
import.meta.hot.accept(true);
`;
exports.useSassTransformer = (0, nano_memoize_1.default)((options) => {
    const { sassImporter } = (0, sass_importer_1.useSassImporter)(options);
    const makeModule = options.sass.moduleType === "style" ? styleModule : cssResultModule;
    async function sassTransformer(filename, content, type) {
        const { css, stats } = sass_1.default.renderSync({
            ...options.sass,
            data: content,
            importer: sassImporter(filename)
        });
        content = css.toString("utf-8");
        if (type === "module") {
            content = makeModule(content);
        }
        // links is undefined since sass has already included the @imports so no need to push them
        // yet we need the watch array to reload the module when an imported file has changed...
        const dirname = path_1.default.dirname(filename);
        return {
            content: content,
            headers: {
                "content-type": type === "module" ? mime_types_1.JAVASCRIPT_CONTENT_TYPE : mime_types_1.CSS_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "x-transformer": "sass-transformer"
            },
            includedFiles: stats.includedFiles.map(included => path_1.default.resolve(dirname, included))
        };
    }
    return {
        sassTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBb0M7QUFDcEMsZ0RBQXdCO0FBQ3hCLGdEQUF3QjtBQUV4QixtREFBNkU7QUFDN0UseURBQXNEO0FBR3RELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7Ozs7OztFQU1qQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Ozs7Ozs7Ozs7Ozs7O0NBY3JDLENBQUM7QUFFRixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDOzs7Ozs7OztFQVE3QixPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Ozs7Q0FJckMsQ0FBQztBQUVXLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSxzQkFBUSxFQUFDLENBQUMsT0FBc0IsRUFBRSxFQUFFO0lBRWxFLE1BQU0sRUFBQyxZQUFZLEVBQUMsR0FBRyxJQUFBLCtCQUFlLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFFaEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztJQUV2RixLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLElBQUk7UUFFbEUsTUFBTSxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsR0FBRyxjQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pDLEdBQUcsT0FBTyxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsT0FBTztZQUNiLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsMEZBQTBGO1FBQzFGLHdGQUF3RjtRQUV4RixNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLE9BQU87WUFDSCxPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9DQUF1QixDQUFDLENBQUMsQ0FBQyw2QkFBZ0I7Z0JBQzlFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUM1QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDdEYsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgc2FzcyBmcm9tIFwic2Fzc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtDU1NfQ09OVEVOVF9UWVBFLCBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZVNhc3NJbXBvcnRlcn0gZnJvbSBcIi4uL3V0aWwvc2Fzcy1pbXBvcnRlclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuY29uc3QgY3NzUmVzdWx0TW9kdWxlID0gY3NzVGV4dCA9PiBgLy8gW0hNUl0gVXBkYXRlIENTU1Jlc3VsdFxyXG5pbXBvcnQge2NyZWF0ZUhvdENvbnRleHR9IGZyb20gXCIvZXNuZXh0LXNlcnZlci1jbGllbnQvbGliL2luZGV4LmpzXCI7IFxyXG5pbXBvcnQubWV0YS5ob3QgPSBjcmVhdGVIb3RDb250ZXh0KGltcG9ydC5tZXRhLnVybCk7XHJcblxyXG5pbXBvcnQge2Nzc30gZnJvbSBcIi93ZWJfbW9kdWxlcy9saXQtZWxlbWVudC5qc1wiO1xyXG5jb25zdCBjc3NSZXN1bHQgPSBjc3NcXGBcclxuJHtjc3NUZXh0LnJlcGxhY2UoLyhbJGBcXFxcXSkvZywgXCJcXFxcJDFcIil9XFxgO1xyXG5leHBvcnQgZGVmYXVsdCBjc3NSZXN1bHQ7IFxyXG5cclxuLy8gRXZlbiBuZXcgY3VzdG9tIGVsZW1lbnQgaW5zdGFuY2VzIHdvdWxkIHVzZSB0aGUgb3JpZ2luYWwgY3NzUmVzdWx0IGluc3RhbmNlXHJcblxyXG5pbXBvcnQubWV0YS5ob3QuZGlzcG9zZSgoKSA9PiB7XHJcbiAgICByZXR1cm4gaW1wb3J0Lm1ldGEuaG90LmNzc1Jlc3VsdCB8fCBjc3NSZXN1bHQ7XHJcbn0pO1xyXG5cclxuaW1wb3J0Lm1ldGEuaG90LmFjY2VwdCgoe21vZHVsZSwgcmVjeWNsZWQ6IGNzc1Jlc3VsdH0pID0+IHtcclxuICAgIGltcG9ydC5tZXRhLmhvdC5jc3NSZXN1bHQgPSBjc3NSZXN1bHQ7XHJcbiAgICBjc3NSZXN1bHQuY3NzVGV4dCA9IG1vZHVsZS5kZWZhdWx0LmNzc1RleHQ7XHJcbiAgICBjc3NSZXN1bHQuc3R5bGVTaGVldC5yZXBsYWNlU3luYyhtb2R1bGUuZGVmYXVsdC5jc3NUZXh0KTtcclxufSk7XHJcbmA7XHJcblxyXG5jb25zdCBzdHlsZU1vZHVsZSA9IGNzc1RleHQgPT4gYC8vIFtITVJdIFJlbG9hZCBTdHlsZVxyXG5pbXBvcnQge2NyZWF0ZUhvdENvbnRleHR9IGZyb20gXCIvZXNuZXh0LXNlcnZlci1jbGllbnQvbGliL2luZGV4LmpzXCI7IFxyXG5pbXBvcnQubWV0YS5ob3QgPSBjcmVhdGVIb3RDb250ZXh0KGltcG9ydC5tZXRhLnVybCk7XHJcblxyXG5jb25zdCBzdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XHJcbmRvY3VtZW50LmhlYWRcclxuICAgIC5hcHBlbmRDaGlsZChzdHlsZUVsZW1lbnQpXHJcbiAgICAuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXFxgXHJcbiR7Y3NzVGV4dC5yZXBsYWNlKC8oWyRgXFxcXF0pL2csIFwiXFxcXCQxXCIpfVxcYCkpO1xyXG5cclxuaW1wb3J0Lm1ldGEuaG90LmRpc3Bvc2UoKCkgPT4gZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQpKTtcclxuaW1wb3J0Lm1ldGEuaG90LmFjY2VwdCh0cnVlKTtcclxuYDtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VTYXNzVHJhbnNmb3JtZXIgPSBtZW1vaXplZCgob3B0aW9uczogRVNOZXh0T3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtzYXNzSW1wb3J0ZXJ9ID0gdXNlU2Fzc0ltcG9ydGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IG1ha2VNb2R1bGUgPSBvcHRpb25zLnNhc3MubW9kdWxlVHlwZSA9PT0gXCJzdHlsZVwiID8gc3R5bGVNb2R1bGUgOiBjc3NSZXN1bHRNb2R1bGU7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gc2Fzc1RyYW5zZm9ybWVyKGZpbGVuYW1lOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZywgdHlwZSk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcclxuXHJcbiAgICAgICAgY29uc3Qge2Nzcywgc3RhdHN9ID0gc2Fzcy5yZW5kZXJTeW5jKHtcclxuICAgICAgICAgICAgLi4ub3B0aW9ucy5zYXNzLFxyXG4gICAgICAgICAgICBkYXRhOiBjb250ZW50LFxyXG4gICAgICAgICAgICBpbXBvcnRlcjogc2Fzc0ltcG9ydGVyKGZpbGVuYW1lKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb250ZW50ID0gY3NzLnRvU3RyaW5nKFwidXRmLThcIik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwibW9kdWxlXCIpIHtcclxuICAgICAgICAgICAgY29udGVudCA9IG1ha2VNb2R1bGUoY29udGVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBsaW5rcyBpcyB1bmRlZmluZWQgc2luY2Ugc2FzcyBoYXMgYWxyZWFkeSBpbmNsdWRlZCB0aGUgQGltcG9ydHMgc28gbm8gbmVlZCB0byBwdXNoIHRoZW1cclxuICAgICAgICAvLyB5ZXQgd2UgbmVlZCB0aGUgd2F0Y2ggYXJyYXkgdG8gcmVsb2FkIHRoZSBtb2R1bGUgd2hlbiBhbiBpbXBvcnRlZCBmaWxlIGhhcyBjaGFuZ2VkLi4uXHJcblxyXG4gICAgICAgIGNvbnN0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZW5hbWUpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiB0eXBlID09PSBcIm1vZHVsZVwiID8gSkFWQVNDUklQVF9DT05URU5UX1RZUEUgOiBDU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb250ZW50KSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcInNhc3MtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpbmNsdWRlZEZpbGVzOiBzdGF0cy5pbmNsdWRlZEZpbGVzLm1hcChpbmNsdWRlZCA9PiBwYXRoLnJlc29sdmUoZGlybmFtZSwgaW5jbHVkZWQpKVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzYXNzVHJhbnNmb3JtZXJcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=