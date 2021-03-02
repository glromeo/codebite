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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBb0M7QUFDcEMsMERBQTZCO0FBQzdCLGdEQUF3QjtBQUV4QixtREFBNkU7QUFDN0UseURBQXNEO0FBR3RELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7OztFQUdqQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Q0FDckMsQ0FBQztBQUVGLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7Ozs7RUFJN0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDO0NBQ3JDLENBQUM7QUFFVyxRQUFBLGtCQUFrQixHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7SUFFbEUsTUFBTSxFQUFDLFlBQVksRUFBQyxHQUFHLCtCQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFaEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztJQUV2RixLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLElBQUk7UUFFbEUsTUFBTSxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsR0FBRyxtQkFBSSxDQUFDLFVBQVUsQ0FBQztZQUNqQyxHQUFHLE9BQU8sQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLE9BQU87WUFDYixRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQztTQUNuQyxDQUFDLENBQUM7UUFFSCxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDbkIsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNqQztRQUVELDBGQUEwRjtRQUMxRix3RkFBd0Y7UUFFeEYsTUFBTSxPQUFPLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV2QyxPQUFPO1lBQ0gsT0FBTyxFQUFFLE9BQU87WUFDaEIsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxvQ0FBdUIsQ0FBQyxDQUFDLENBQUMsNkJBQWdCO2dCQUM5RSxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsZUFBZSxFQUFFLGtCQUFrQjthQUN0QztZQUNELGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3RGLENBQUM7SUFDTixDQUFDO0lBRUQsT0FBTztRQUNILGVBQWU7S0FDbEIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcbmltcG9ydCBzYXNzIGZyb20gXCJub2RlLXNhc3NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcbmltcG9ydCB7Q1NTX0NPTlRFTlRfVFlQRSwgSkFWQVNDUklQVF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7dXNlU2Fzc0ltcG9ydGVyfSBmcm9tIFwiLi4vdXRpbC9zYXNzLWltcG9ydGVyXCI7XG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xuXG5jb25zdCBjc3NSZXN1bHRNb2R1bGUgPSBjc3NUZXh0ID0+IGBcXFxuaW1wb3J0IHtjc3N9IGZyb20gXCIvd2ViX21vZHVsZXMvbGl0LWVsZW1lbnQuanNcIjtcbmV4cG9ydCBkZWZhdWx0IGNzc1xcYFxuJHtjc3NUZXh0LnJlcGxhY2UoLyhbJGBcXFxcXSkvZywgXCJcXFxcJDFcIil9XFxgO1xuYDtcblxuY29uc3Qgc3R5bGVNb2R1bGUgPSBjc3NUZXh0ID0+IGBcXFxuZG9jdW1lbnQuaGVhZFxuICAgIC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIikpXG4gICAgLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFxcYFxuJHtjc3NUZXh0LnJlcGxhY2UoLyhbJGBcXFxcXSkvZywgXCJcXFxcJDFcIil9XFxgKSk7XG5gO1xuXG5leHBvcnQgY29uc3QgdXNlU2Fzc1RyYW5zZm9ybWVyID0gbWVtb2l6ZWQoKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpID0+IHtcblxuICAgIGNvbnN0IHtzYXNzSW1wb3J0ZXJ9ID0gdXNlU2Fzc0ltcG9ydGVyKG9wdGlvbnMpO1xuXG4gICAgY29uc3QgbWFrZU1vZHVsZSA9IG9wdGlvbnMuc2Fzcy5tb2R1bGVUeXBlID09PSBcInN0eWxlXCIgPyBzdHlsZU1vZHVsZSA6IGNzc1Jlc3VsdE1vZHVsZTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIHNhc3NUcmFuc2Zvcm1lcihmaWxlbmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcsIHR5cGUpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XG5cbiAgICAgICAgY29uc3Qge2Nzcywgc3RhdHN9ID0gc2Fzcy5yZW5kZXJTeW5jKHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuc2FzcyxcbiAgICAgICAgICAgIGRhdGE6IGNvbnRlbnQsXG4gICAgICAgICAgICBpbXBvcnRlcjogc2Fzc0ltcG9ydGVyKGZpbGVuYW1lKVxuICAgICAgICB9KTtcblxuICAgICAgICBjb250ZW50ID0gY3NzLnRvU3RyaW5nKFwidXRmLThcIik7XG4gICAgICAgIGlmICh0eXBlID09PSBcIm1vZHVsZVwiKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gbWFrZU1vZHVsZShjb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxpbmtzIGlzIHVuZGVmaW5lZCBzaW5jZSBzYXNzIGhhcyBhbHJlYWR5IGluY2x1ZGVkIHRoZSBAaW1wb3J0cyBzbyBubyBuZWVkIHRvIHB1c2ggdGhlbVxuICAgICAgICAvLyB5ZXQgd2UgbmVlZCB0aGUgd2F0Y2ggYXJyYXkgdG8gcmVsb2FkIHRoZSBtb2R1bGUgd2hlbiBhbiBpbXBvcnRlZCBmaWxlIGhhcyBjaGFuZ2VkLi4uXG5cbiAgICAgICAgY29uc3QgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogdHlwZSA9PT0gXCJtb2R1bGVcIiA/IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFIDogQ1NTX0NPTlRFTlRfVFlQRSxcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcInNhc3MtdHJhbnNmb3JtZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluY2x1ZGVkRmlsZXM6IHN0YXRzLmluY2x1ZGVkRmlsZXMubWFwKGluY2x1ZGVkID0+IHBhdGgucmVzb2x2ZShkaXJuYW1lLCBpbmNsdWRlZCkpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2Fzc1RyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19