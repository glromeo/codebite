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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvc2Fzcy10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnRUFBbUM7QUFDbkMsMERBQTZCO0FBRTdCLG1EQUE2RTtBQUM3RSx5REFBc0Q7QUFHdEQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs7O0VBR2pDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQztDQUNyQyxDQUFDO0FBRUYsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQzs7OztFQUk3QixPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7Q0FDckMsQ0FBQztBQUVXLFFBQUEsa0JBQWtCLEdBQUcsc0JBQU8sQ0FBQyxDQUFDLE9BQXNCLEVBQUUsRUFBRTtJQUVqRSxNQUFNLEVBQUMsWUFBWSxFQUFDLEdBQUcsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVoRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRXZGLEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsSUFBSTtRQUVsRSxNQUFNLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBQyxHQUFHLG1CQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pDLEdBQUcsT0FBTyxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsT0FBTztZQUNiLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsMEZBQTBGO1FBQzFGLHdGQUF3RjtRQUV4RixPQUFPO1lBQ0gsT0FBTyxFQUFFLE9BQU87WUFDaEIsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxvQ0FBdUIsQ0FBQyxDQUFDLENBQUMsNkJBQWdCO2dCQUM5RSxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsZUFBZSxFQUFFLGtCQUFrQjthQUN0QztZQUNELGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtTQUNyQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxlQUFlO0tBQ2xCLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcbmltcG9ydCBzYXNzIGZyb20gXCJub2RlLXNhc3NcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtDU1NfQ09OVEVOVF9UWVBFLCBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHt1c2VTYXNzSW1wb3J0ZXJ9IGZyb20gXCIuLi91dGlsL3Nhc3MtaW1wb3J0ZXJcIjtcbmltcG9ydCB7VHJhbnNmb3JtZXJPdXRwdXR9IGZyb20gXCIuL2luZGV4XCI7XG5cbmNvbnN0IGNzc1Jlc3VsdE1vZHVsZSA9IGNzc1RleHQgPT4gYFxcXG5pbXBvcnQge2Nzc30gZnJvbSBcIi93ZWJfbW9kdWxlcy9saXQtZWxlbWVudC5qc1wiO1xuZXhwb3J0IGRlZmF1bHQgY3NzXFxgXG4ke2Nzc1RleHQucmVwbGFjZSgvKFskYFxcXFxdKS9nLCBcIlxcXFwkMVwiKX1cXGA7XG5gO1xuXG5jb25zdCBzdHlsZU1vZHVsZSA9IGNzc1RleHQgPT4gYFxcXG5kb2N1bWVudC5oZWFkXG4gICAgLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKSlcbiAgICAuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXFxgXG4ke2Nzc1RleHQucmVwbGFjZSgvKFskYFxcXFxdKS9nLCBcIlxcXFwkMVwiKX1cXGApKTtcbmA7XG5cbmV4cG9ydCBjb25zdCB1c2VTYXNzVHJhbnNmb3JtZXIgPSBtZW1vaXplKChvcHRpb25zOiBFU05leHRPcHRpb25zKSA9PiB7XG5cbiAgICBjb25zdCB7c2Fzc0ltcG9ydGVyfSA9IHVzZVNhc3NJbXBvcnRlcihvcHRpb25zKTtcblxuICAgIGNvbnN0IG1ha2VNb2R1bGUgPSBvcHRpb25zLnNhc3MubW9kdWxlVHlwZSA9PT0gXCJzdHlsZVwiID8gc3R5bGVNb2R1bGUgOiBjc3NSZXN1bHRNb2R1bGU7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBzYXNzVHJhbnNmb3JtZXIoZmlsZW5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nLCB0eXBlKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xuXG4gICAgICAgIGNvbnN0IHtjc3MsIHN0YXRzfSA9IHNhc3MucmVuZGVyU3luYyh7XG4gICAgICAgICAgICAuLi5vcHRpb25zLnNhc3MsXG4gICAgICAgICAgICBkYXRhOiBjb250ZW50LFxuICAgICAgICAgICAgaW1wb3J0ZXI6IHNhc3NJbXBvcnRlcihmaWxlbmFtZSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGVudCA9IGNzcy50b1N0cmluZyhcInV0Zi04XCIpO1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgY29udGVudCA9IG1ha2VNb2R1bGUoY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsaW5rcyBpcyB1bmRlZmluZWQgc2luY2Ugc2FzcyBoYXMgYWxyZWFkeSBpbmNsdWRlZCB0aGUgQGltcG9ydHMgc28gbm8gbmVlZCB0byBwdXNoIHRoZW1cbiAgICAgICAgLy8geWV0IHdlIG5lZWQgdGhlIHdhdGNoIGFycmF5IHRvIHJlbG9hZCB0aGUgbW9kdWxlIHdoZW4gYW4gaW1wb3J0ZWQgZmlsZSBoYXMgY2hhbmdlZC4uLlxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGUgPT09IFwibW9kdWxlXCIgPyBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSA6IENTU19DT05URU5UX1RZUEUsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb250ZW50KSxcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJzYXNzLXRyYW5zZm9ybWVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbmNsdWRlZEZpbGVzOiBzdGF0cy5pbmNsdWRlZEZpbGVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2Fzc1RyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19