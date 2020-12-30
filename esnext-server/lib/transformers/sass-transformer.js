const log = require("tiny-node-logger");
const {memoize} = require("esnext-server-extras");
const sass = require("node-sass");

const {useSassImporter} = require("../util/sass-importer.js");

const {
    JAVASCRIPT_CONTENT_TYPE,
    CSS_CONTENT_TYPE
} = require("esnext-server-extras");

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

module.exports.useSassTransformer = memoize((config, watcher) => {

    const {sassImporter} = useSassImporter(config, watcher);

    const makeModule = config.sass.moduleType === "style" ? styleModule : cssResultModule;

    async function sassTransformer(filename, content, type, userAgent) {

        const {css, stats} = sass.renderSync({
            ...config.sass,
            data: content,
            importer: sassImporter(filename)
        });

        content = css.toString("utf-8");
        if (type === "module") {
            content = makeModule(content);
        }

        return {
            content: content,
            headers: {
                "content-type": type === "module" ? JAVASCRIPT_CONTENT_TYPE : CSS_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "x-transformer": "sass-transformer"
            },
            links: undefined, // sass has already included the @imports so no need to push them
            watch: stats.includedFiles
        };
    }

    return {
        sassTransformer
    };
});
