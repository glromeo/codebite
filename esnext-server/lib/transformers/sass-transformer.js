"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassTransformer = void 0;
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const node_sass_1 = __importDefault(require("node-sass"));
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
exports.useSassTransformer = pico_memoize_1.default((options) => {
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
        return {
            content: content,
            headers: {
                "content-type": type === "module" ? mime_types_1.JAVASCRIPT_CONTENT_TYPE : mime_types_1.CSS_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "x-transformer": "sass-transformer"
            },
            includedFiles: stats.includedFiles
        };
    }
    return {
        sassTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBbUM7QUFDbkMsMERBQTZCO0FBRTdCLG1EQUE2RTtBQUM3RSx5REFBc0Q7QUFHdEQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs7O0VBR2pDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQztDQUNyQyxDQUFDO0FBRUYsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs7OztFQUk3QixPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Q0FDckMsQ0FBQztBQUVXLFFBQUEsa0JBQWtCLEdBQUcsc0JBQU8sQ0FBQyxDQUFDLE9BQXNCLEVBQUUsRUFBRTtJQUVqRSxNQUFNLEVBQUMsWUFBWSxFQUFDLEdBQUcsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVoRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRXZGLEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsSUFBSTtRQUVsRSxNQUFNLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBQyxHQUFHLG1CQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pDLEdBQUcsT0FBTyxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsT0FBTztZQUNiLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsMEZBQTBGO1FBQzFGLHdGQUF3RjtRQUV4RixPQUFPO1lBQ0gsT0FBTyxFQUFFLE9BQU87WUFDaEIsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxvQ0FBdUIsQ0FBQyxDQUFDLENBQUMsNkJBQWdCO2dCQUM5RSxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsZUFBZSxFQUFFLGtCQUFrQjthQUN0QztZQUNELGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtTQUNyQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxlQUFlO0tBQ2xCLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcclxuaW1wb3J0IHNhc3MgZnJvbSBcIm5vZGUtc2Fzc1wiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtDU1NfQ09OVEVOVF9UWVBFLCBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZVNhc3NJbXBvcnRlcn0gZnJvbSBcIi4uL3V0aWwvc2Fzcy1pbXBvcnRlclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuY29uc3QgY3NzUmVzdWx0TW9kdWxlID0gY3NzVGV4dCA9PiBgXFxcclxuaW1wb3J0IHtjc3N9IGZyb20gXCIvd2ViX21vZHVsZXMvbGl0LWVsZW1lbnQuanNcIjtcclxuZXhwb3J0IGRlZmF1bHQgY3NzXFxgXHJcbiR7Y3NzVGV4dC5yZXBsYWNlKC8oWyRgXFxcXF0pL2csIFwiXFxcXCQxXCIpfVxcYDtcclxuYDtcclxuXHJcbmNvbnN0IHN0eWxlTW9kdWxlID0gY3NzVGV4dCA9PiBgXFxcclxuZG9jdW1lbnQuaGVhZFxyXG4gICAgLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKSlcclxuICAgIC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcXGBcclxuJHtjc3NUZXh0LnJlcGxhY2UoLyhbJGBcXFxcXSkvZywgXCJcXFxcJDFcIil9XFxgKSk7XHJcbmA7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlU2Fzc1RyYW5zZm9ybWVyID0gbWVtb2l6ZSgob3B0aW9uczogRVNOZXh0T3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtzYXNzSW1wb3J0ZXJ9ID0gdXNlU2Fzc0ltcG9ydGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IG1ha2VNb2R1bGUgPSBvcHRpb25zLnNhc3MubW9kdWxlVHlwZSA9PT0gXCJzdHlsZVwiID8gc3R5bGVNb2R1bGUgOiBjc3NSZXN1bHRNb2R1bGU7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gc2Fzc1RyYW5zZm9ybWVyKGZpbGVuYW1lOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZywgdHlwZSk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcclxuXHJcbiAgICAgICAgY29uc3Qge2Nzcywgc3RhdHN9ID0gc2Fzcy5yZW5kZXJTeW5jKHtcclxuICAgICAgICAgICAgLi4ub3B0aW9ucy5zYXNzLFxyXG4gICAgICAgICAgICBkYXRhOiBjb250ZW50LFxyXG4gICAgICAgICAgICBpbXBvcnRlcjogc2Fzc0ltcG9ydGVyKGZpbGVuYW1lKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb250ZW50ID0gY3NzLnRvU3RyaW5nKFwidXRmLThcIik7XHJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwibW9kdWxlXCIpIHtcclxuICAgICAgICAgICAgY29udGVudCA9IG1ha2VNb2R1bGUoY29udGVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBsaW5rcyBpcyB1bmRlZmluZWQgc2luY2Ugc2FzcyBoYXMgYWxyZWFkeSBpbmNsdWRlZCB0aGUgQGltcG9ydHMgc28gbm8gbmVlZCB0byBwdXNoIHRoZW1cclxuICAgICAgICAvLyB5ZXQgd2UgbmVlZCB0aGUgd2F0Y2ggYXJyYXkgdG8gcmVsb2FkIHRoZSBtb2R1bGUgd2hlbiBhbiBpbXBvcnRlZCBmaWxlIGhhcyBjaGFuZ2VkLi4uXHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGUgPT09IFwibW9kdWxlXCIgPyBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSA6IENTU19DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwic2Fzcy10cmFuc2Zvcm1lclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGluY2x1ZGVkRmlsZXM6IHN0YXRzLmluY2x1ZGVkRmlsZXNcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc2Fzc1RyYW5zZm9ybWVyXHJcbiAgICB9O1xyXG59KTtcclxuIl19