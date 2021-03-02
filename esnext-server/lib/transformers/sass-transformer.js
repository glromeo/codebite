"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassTransformer = void 0;
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const node_sass_1 = __importDefault(require("node-sass"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
const sass_importer_1 = require("../util/sass-importer");
const cssResultModule = cssText => `\
import {css} from "/web_modules/lit-element.js";
export default css\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`;
`;
const styleModule = cssText => `\
document.head
    .appendChild(document.createElement("style"))
    .appendChild(document.createTextNode(\`
${cssText.replace(/([$`\\])/g, "\\$1")}\`));
`;
exports.useSassTransformer = nano_memoize_1.default((options) => {
    const { sassImporter } = sass_importer_1.useSassImporter(options);
    const makeModule = options.sass.moduleType === "style" ? styleModule : cssResultModule;
    async function sassTransformer(filename, content, type) {
        const { css, stats } = node_sass_1.default.renderSync({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBb0M7QUFDcEMsMERBQTZCO0FBQzdCLGdEQUF3QjtBQUV4QixtREFBNkU7QUFDN0UseURBQXNEO0FBR3RELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7OztFQUdqQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Q0FDckMsQ0FBQztBQUVGLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7Ozs7RUFJN0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDO0NBQ3JDLENBQUM7QUFFVyxRQUFBLGtCQUFrQixHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7SUFFbEUsTUFBTSxFQUFDLFlBQVksRUFBQyxHQUFHLCtCQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFaEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztJQUV2RixLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLElBQUk7UUFFbEUsTUFBTSxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsR0FBRyxtQkFBSSxDQUFDLFVBQVUsQ0FBQztZQUNqQyxHQUFHLE9BQU8sQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLE9BQU87WUFDYixRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQztTQUNuQyxDQUFDLENBQUM7UUFFSCxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDbkIsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNqQztRQUVELDBGQUEwRjtRQUMxRix3RkFBd0Y7UUFFeEYsTUFBTSxPQUFPLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV2QyxPQUFPO1lBQ0gsT0FBTyxFQUFFLE9BQU87WUFDaEIsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxvQ0FBdUIsQ0FBQyxDQUFDLENBQUMsNkJBQWdCO2dCQUM5RSxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsZUFBZSxFQUFFLGtCQUFrQjthQUN0QztZQUNELGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3RGLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGVBQWU7S0FDbEIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHNhc3MgZnJvbSBcIm5vZGUtc2Fzc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtDU1NfQ09OVEVOVF9UWVBFLCBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZVNhc3NJbXBvcnRlcn0gZnJvbSBcIi4uL3V0aWwvc2Fzcy1pbXBvcnRlclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuY29uc3QgY3NzUmVzdWx0TW9kdWxlID0gY3NzVGV4dCA9PiBgXFxcclxuaW1wb3J0IHtjc3N9IGZyb20gXCIvd2ViX21vZHVsZXMvbGl0LWVsZW1lbnQuanNcIjtcclxuZXhwb3J0IGRlZmF1bHQgY3NzXFxgXHJcbiR7Y3NzVGV4dC5yZXBsYWNlKC8oWyRgXFxcXF0pL2csIFwiXFxcXCQxXCIpfVxcYDtcclxuYDtcclxuXHJcbmNvbnN0IHN0eWxlTW9kdWxlID0gY3NzVGV4dCA9PiBgXFxcclxuZG9jdW1lbnQuaGVhZFxyXG4gICAgLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKSlcclxuICAgIC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcXGBcclxuJHtjc3NUZXh0LnJlcGxhY2UoLyhbJGBcXFxcXSkvZywgXCJcXFxcJDFcIil9XFxgKSk7XHJcbmA7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlU2Fzc1RyYW5zZm9ybWVyID0gbWVtb2l6ZWQoKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpID0+IHtcclxuXHJcbiAgICBjb25zdCB7c2Fzc0ltcG9ydGVyfSA9IHVzZVNhc3NJbXBvcnRlcihvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCBtYWtlTW9kdWxlID0gb3B0aW9ucy5zYXNzLm1vZHVsZVR5cGUgPT09IFwic3R5bGVcIiA/IHN0eWxlTW9kdWxlIDogY3NzUmVzdWx0TW9kdWxlO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHNhc3NUcmFuc2Zvcm1lcihmaWxlbmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcsIHR5cGUpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHtjc3MsIHN0YXRzfSA9IHNhc3MucmVuZGVyU3luYyh7XHJcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuc2FzcyxcclxuICAgICAgICAgICAgZGF0YTogY29udGVudCxcclxuICAgICAgICAgICAgaW1wb3J0ZXI6IHNhc3NJbXBvcnRlcihmaWxlbmFtZSlcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29udGVudCA9IGNzcy50b1N0cmluZyhcInV0Zi04XCIpO1xyXG4gICAgICAgIGlmICh0eXBlID09PSBcIm1vZHVsZVwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQgPSBtYWtlTW9kdWxlKGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbGlua3MgaXMgdW5kZWZpbmVkIHNpbmNlIHNhc3MgaGFzIGFscmVhZHkgaW5jbHVkZWQgdGhlIEBpbXBvcnRzIHNvIG5vIG5lZWQgdG8gcHVzaCB0aGVtXHJcbiAgICAgICAgLy8geWV0IHdlIG5lZWQgdGhlIHdhdGNoIGFycmF5IHRvIHJlbG9hZCB0aGUgbW9kdWxlIHdoZW4gYW4gaW1wb3J0ZWQgZmlsZSBoYXMgY2hhbmdlZC4uLlxyXG5cclxuICAgICAgICBjb25zdCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogdHlwZSA9PT0gXCJtb2R1bGVcIiA/IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFIDogQ1NTX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoY29udGVudCksXHJcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJzYXNzLXRyYW5zZm9ybWVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaW5jbHVkZWRGaWxlczogc3RhdHMuaW5jbHVkZWRGaWxlcy5tYXAoaW5jbHVkZWQgPT4gcGF0aC5yZXNvbHZlKGRpcm5hbWUsIGluY2x1ZGVkKSlcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc2Fzc1RyYW5zZm9ybWVyXHJcbiAgICB9O1xyXG59KTtcclxuIl19