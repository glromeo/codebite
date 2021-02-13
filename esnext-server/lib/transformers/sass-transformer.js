"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassTransformer = void 0;
const nano_memoize_1 = __importDefault(require("nano-memoize"));
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
        return {
            content: content,
            headers: {
                "content-type": type === "module" ? mime_types_1.JAVASCRIPT_CONTENT_TYPE : mime_types_1.CSS_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "x-transformer": "sass-transformer"
            },
            watch: stats.includedFiles
        };
    }
    return {
        sassTransformer
    };
});
//# sourceMappingURL=sass-transformer.js.map