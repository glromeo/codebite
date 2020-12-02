const log = require("@codebite/logger");
const {memoize} = require("@codebite/utility");
const {useWebModulesPlugin} = require("@codebite/web-modules");
const {transformFromAstSync} = require("@babel/core");
const {parseSync} = require("@babel/core");
const {JAVASCRIPT_CONTENT_TYPE} = require("@codebite/utility");

const path = require("path");

module.exports.useBabelTransformer = memoize((config, sourceMaps = false) => {

    const {resolveImports, rewriteImports} = useWebModulesPlugin(config);

    async function babelTransformer(filename, content) {

        const options = {
            ...config.babel,
            sourceMaps
        };

        const source = content;
        const parsedAst = parseSync(source, options);
        const importMap = await resolveImports(filename, parsedAst);

        let {code, map, metadata: {imports}} = transformFromAstSync(parsedAst, source, {
            ...options,
            plugins: [
                ...options.plugins,
                [rewriteImports, {importMap}]
            ],
            filename: filename
        });

        if (map) {
            code += "\n//# sourceMappingURL=" + path.basename(filename) + ".map\n";
        } else {
            code += "\n";
        }

        return {
            content: code,
            headers: {
                "content-type": JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "babel-transformer"
            },
            map,
            links: imports
        };
    }

    return {
        babelTransformer
    };
});
