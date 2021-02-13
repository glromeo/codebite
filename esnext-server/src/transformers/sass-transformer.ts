import memoized from "nano-memoize";
import sass from "node-sass";
import {ESNextOptions} from "../configure";
import {CSS_CONTENT_TYPE, JAVASCRIPT_CONTENT_TYPE} from "../util/mime-types";
import {useSassImporter} from "../util/sass-importer";
import {TransformerOutput} from "./index";

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

export const useSassTransformer = memoized((options: ESNextOptions) => {

    const {sassImporter} = useSassImporter(options);

    const makeModule = options.sass.moduleType === "style" ? styleModule : cssResultModule;

    async function sassTransformer(filename: string, content: string, type): Promise<TransformerOutput> {

        const {css, stats} = sass.renderSync({
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
                "content-type": type === "module" ? JAVASCRIPT_CONTENT_TYPE : CSS_CONTENT_TYPE,
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
