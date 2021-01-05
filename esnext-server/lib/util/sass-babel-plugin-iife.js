"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const helper_module_transforms_1 = require("@babel/helper-module-transforms");
const helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
const path_1 = require("path");
const wrapper = core_1.template(`
    (function(IMPORT_NAMES) {
    })(BROWSER_ARGUMENTS);
`);
exports.default = helper_plugin_utils_1.declare((api, options) => {
    api.assertVersion(7);
    const { loose, allowTopLevelThis, strict, strictMode, noInterop, exportNamespace, importNamespace, importRelativePath } = options;
    function buildExportNamespace() {
        const members = exportNamespace ? exportNamespace.split(".") : [];
        let id = core_1.types.thisExpression();
        return {
            expression: id,
            statements: members.map(seg => {
                id = core_1.types.memberExpression(id, core_1.types.identifier(seg));
                return core_1.types.expressionStatement(core_1.types.assignmentExpression("=", id, core_1.types.logicalExpression("||", id, core_1.types.objectExpression([]))));
            })
        };
    }
    function buildImportNamespace() {
        const members = importNamespace ? importNamespace.split(".") : [];
        return members.reduce((acc, current) => core_1.types.memberExpression(acc, core_1.types.identifier(current)), core_1.types.thisExpression());
    }
    /**
     * Build the member expression that reads from a global for a given source.
     */
    function buildBrowserArg(source, namespace) {
        const idPath = importRelativePath ? path_1.resolve(importRelativePath, source) : source;
        const parts = path_1.parse(idPath);
        return core_1.types.memberExpression(namespace, core_1.types.identifier(core_1.types.toIdentifier(`${parts.dir}/${parts.name}`)));
    }
    return {
        visitor: {
            Program: {
                exit(path) {
                    if (!helper_module_transforms_1.isModule(path))
                        return;
                    const { meta } = helper_module_transforms_1.rewriteModuleStatementsAndPrepareHeader(path, {
                        loose,
                        strict,
                        strictMode,
                        allowTopLevelThis,
                        noInterop
                    });
                    // The arguments of the outer, IIFE function
                    const iifeArgs = [];
                    // The corresponding arguments to the inner function called by the IIFE
                    const innerArgs = [];
                    // If exports are detected, set up the export namespace info
                    let exportStatements = [];
                    if (helper_module_transforms_1.hasExports(meta)) {
                        const exportNamespaceInfo = buildExportNamespace();
                        exportStatements = exportNamespaceInfo.statements;
                        iifeArgs.push(exportNamespaceInfo.expression);
                        innerArgs.push(core_1.types.identifier(meta.exportName));
                    }
                    // Get the import namespace and build up the 2 sets of arguments based on the module's import statements
                    const importExpression = buildImportNamespace();
                    for (const [source, metadata] of meta.source) {
                        iifeArgs.push(buildBrowserArg(source, importExpression));
                        innerArgs.push(core_1.types.identifier(metadata.name));
                    }
                    // Cache the module's body and directives and then clear them out so they can be wrapped with the IIFE
                    const { body, directives } = path.node;
                    path.node.directives = [];
                    path.node.body = [];
                    // Get the iife wrapper Node
                    const wrappedBody = wrapper({
                        BROWSER_ARGUMENTS: iifeArgs,
                        IMPORT_NAMES: innerArgs
                    });
                    // Re-build the path:
                    //  - Add the statements that ensure the export namespace exists (if the module has exports)
                    //  - Add the IIFE wrapper
                    //  - Query the wrapper to get its body
                    //  - Add the cached directives and original body to the IIFE wrapper
                    for (let exportStatement of exportStatements) {
                        path.pushContainer("body", exportStatement);
                    }
                    const umdWrapper = path.pushContainer("body", [wrappedBody])[0];
                    const umdFactory = umdWrapper.get("expression.callee.body");
                    umdFactory.pushContainer("body", directives);
                    umdFactory.pushContainer("body", body);
                }
            }
        }
    };
});
//# sourceMappingURL=sass-babel-plugin-iife.js.map