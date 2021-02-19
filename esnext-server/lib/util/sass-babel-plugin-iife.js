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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1iYWJlbC1wbHVnaW4taWlmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtYmFiZWwtcGx1Z2luLWlpZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBaUQ7QUFDakQsOEVBQThHO0FBQzlHLG9FQUFtRDtBQUVuRCwrQkFBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQUcsZUFBUSxDQUFDOzs7Q0FHeEIsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsNkJBQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNwQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJCLE1BQU0sRUFDRixLQUFLLEVBQ0wsaUJBQWlCLEVBQ2pCLE1BQU0sRUFDTixVQUFVLEVBQ1YsU0FBUyxFQUNULGVBQWUsRUFDZixlQUFlLEVBQ2Ysa0JBQWtCLEVBQ3JCLEdBQUcsT0FBTyxDQUFDO0lBRVosU0FBUyxvQkFBb0I7UUFDekIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbEUsSUFBSSxFQUFFLEdBQXNDLFlBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMvRCxPQUFPO1lBQ0gsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDMUIsRUFBRSxHQUFHLFlBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsWUFBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLFlBQUMsQ0FBQyxtQkFBbUIsQ0FDeEIsWUFBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsWUFBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxFQUFFLEVB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QUFHLEVBQUUsQ0FBQztvQkFFcEIsNEJBQTRCO29CQUM1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7d0JBQ3hCLGlCQUFpQixFQUFFLFFBQVE7d0JBQzNCLFlBQVksRUFBRSxTQUFTO3FCQUMxQixDQUFDLENBQUM7b0JBRUgscUJBQXFCO29CQUNyQiw0RkFBNEY7b0JBQzVGLDBCQUEwQjtvQkFDMUIsdUNBQXVDO29CQUN2QyxxRUFBcUU7b0JBQ3JFLEtBQUssSUFBSSxlQUFlLElBQUksZ0JBQWdCLEVBQUU7d0JBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO3FCQUMvQztvQkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDNUQsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzdDLFVBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO2FBQ0o7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dGVtcGxhdGUsIHR5cGVzIGFzIHR9IGZyb20gXCJAYmFiZWwvY29yZVwiO1xyXG5pbXBvcnQge2hhc0V4cG9ydHMsIGlzTW9kdWxlLCByZXdyaXRlTW9kdWxlU3RhdGVtZW50c0FuZFByZXBhcmVIZWFkZXJ9IGZyb20gXCJAYmFiZWwvaGVscGVyLW1vZHVsZS10cmFuc2Zvcm1zXCI7XHJcbmltcG9ydCB7ZGVjbGFyZX0gZnJvbSBcIkBiYWJlbC9oZWxwZXItcGx1Z2luLXV0aWxzXCI7XHJcbmltcG9ydCB7SWRlbnRpZmllciwgTWVtYmVyRXhwcmVzc2lvbiwgVGhpc0V4cHJlc3Npb259IGZyb20gXCJAYmFiZWwvdHlwZXNcIjtcclxuaW1wb3J0IHtwYXJzZSwgcmVzb2x2ZX0gZnJvbSBcInBhdGhcIjtcclxuXHJcbmNvbnN0IHdyYXBwZXIgPSB0ZW1wbGF0ZShgXHJcbiAgICAoZnVuY3Rpb24oSU1QT1JUX05BTUVTKSB7XHJcbiAgICB9KShCUk9XU0VSX0FSR1VNRU5UUyk7XHJcbmApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVjbGFyZSgoYXBpLCBvcHRpb25zKSA9PiB7XHJcbiAgICBhcGkuYXNzZXJ0VmVyc2lvbig3KTtcclxuXHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgbG9vc2UsXHJcbiAgICAgICAgYWxsb3dUb3BMZXZlbFRoaXMsXHJcbiAgICAgICAgc3RyaWN0LFxyXG4gICAgICAgIHN0cmljdE1vZGUsXHJcbiAgICAgICAgbm9JbnRlcm9wLFxyXG4gICAgICAgIGV4cG9ydE5hbWVzcGFjZSxcclxuICAgICAgICBpbXBvcnROYW1lc3BhY2UsXHJcbiAgICAgICAgaW1wb3J0UmVsYXRpdmVQYXRoXHJcbiAgICB9ID0gb3B0aW9ucztcclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZEV4cG9ydE5hbWVzcGFjZSgpIHtcclxuICAgICAgICBjb25zdCBtZW1iZXJzID0gZXhwb3J0TmFtZXNwYWNlID8gZXhwb3J0TmFtZXNwYWNlLnNwbGl0KFwiLlwiKSA6IFtdO1xyXG4gICAgICAgIGxldCBpZDogTWVtYmVyRXhwcmVzc2lvbiB8IFRoaXNFeHByZXNzaW9uID0gdC50aGlzRXhwcmVzc2lvbigpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGlkLFxyXG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBtZW1iZXJzLm1hcChzZWcgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWQgPSB0Lm1lbWJlckV4cHJlc3Npb24oaWQsIHQuaWRlbnRpZmllcihzZWcpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0LmV4cHJlc3Npb25TdGF0ZW1lbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgdC5hc3NpZ25tZW50RXhwcmVzc2lvbihcIj1cIiwgaWQsIHQubG9naWNhbEV4cHJlc3Npb24oXCJ8fFwiLCBpZCwgdC5vYmplY3RFeHByZXNzaW9uKFtdKSkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRJbXBvcnROYW1lc3BhY2UoKSB7XHJcbiAgICAgICAgY29uc3QgbWVtYmVycyA9IGltcG9ydE5hbWVzcGFjZSA/IGltcG9ydE5hbWVzcGFjZS5zcGxpdChcIi5cIikgOiBbXTtcclxuICAgICAgICByZXR1cm4gbWVtYmVycy5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4gdC5tZW1iZXJFeHByZXNzaW9uKGFjYywgdC5pZGVudGlmaWVyKGN1cnJlbnQpKSwgdC50aGlzRXhwcmVzc2lvbigpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1aWxkIHRoZSBtZW1iZXIgZXhwcmVzc2lvbiB0aGF0IHJlYWRzIGZyb20gYSBnbG9iYWwgZm9yIGEgZ2l2ZW4gc291cmNlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBidWlsZEJyb3dzZXJBcmcoc291cmNlLCBuYW1lc3BhY2UpIHtcclxuICAgICAgICBjb25zdCBpZFBhdGggPSBpbXBvcnRSZWxhdGl2ZVBhdGggPyByZXNvbHZlKGltcG9ydFJlbGF0aXZlUGF0aCwgc291cmNlKSA6IHNvdXJjZTtcclxuICAgICAgICBjb25zdCBwYXJ0cyA9IHBhcnNlKGlkUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIHQubWVtYmVyRXhwcmVzc2lvbihuYW1lc3BhY2UsIHQuaWRlbnRpZmllcih0LnRvSWRlbnRpZmllcihgJHtwYXJ0cy5kaXJ9LyR7cGFydHMubmFtZX1gKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmlzaXRvcjoge1xyXG4gICAgICAgICAgICBQcm9ncmFtOiB7XHJcbiAgICAgICAgICAgICAgICBleGl0KHBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTW9kdWxlKHBhdGgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHttZXRhfSA9IHJld3JpdGVNb2R1bGVTdGF0ZW1lbnRzQW5kUHJlcGFyZUhlYWRlcihwYXRoLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvb3NlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmljdE1vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93VG9wTGV2ZWxUaGlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub0ludGVyb3BcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGFyZ3VtZW50cyBvZiB0aGUgb3V0ZXIsIElJRkUgZnVuY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpaWZlQXJnczogKE1lbWJlckV4cHJlc3Npb24gfCBUaGlzRXhwcmVzc2lvbilbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29ycmVzcG9uZGluZyBhcmd1bWVudHMgdG8gdGhlIGlubmVyIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgSUlGRVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlubmVyQXJnczogSWRlbnRpZmllcltdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGV4cG9ydHMgYXJlIGRldGVjdGVkLCBzZXQgdXAgdGhlIGV4cG9ydCBuYW1lc3BhY2UgaW5mb1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHBvcnRTdGF0ZW1lbnRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0V4cG9ydHMobWV0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0TmFtZXNwYWNlSW5mbyA9IGJ1aWxkRXhwb3J0TmFtZXNwYWNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydFN0YXRlbWVudHMgPSBleHBvcnROYW1lc3BhY2VJbmZvLnN0YXRlbWVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlpZmVBcmdzLnB1c2goZXhwb3J0TmFtZXNwYWNlSW5mby5leHByZXNzaW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJBcmdzLnB1c2godC5pZGVudGlmaWVyKG1ldGEuZXhwb3J0TmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbXBvcnQgbmFtZXNwYWNlIGFuZCBidWlsZCB1cCB0aGUgMiBzZXRzIG9mIGFyZ3VtZW50cyBiYXNlZCBvbiB0aGUgbW9kdWxlJ3MgaW1wb3J0IHN0YXRlbWVudHNcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRFeHByZXNzaW9uID0gYnVpbGRJbXBvcnROYW1lc3BhY2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtzb3VyY2UsIG1ldGFkYXRhXSBvZiBtZXRhLnNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpaWZlQXJncy5wdXNoKGJ1aWxkQnJvd3NlckFyZyhzb3VyY2UsIGltcG9ydEV4cHJlc3Npb24pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJBcmdzLnB1c2godC5pZGVudGlmaWVyKG1ldGFkYXRhLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENhY2hlIHRoZSBtb2R1bGUncyBib2R5IGFuZCBkaXJlY3RpdmVzIGFuZCB0aGVuIGNsZWFyIHRoZW0gb3V0IHNvIHRoZXkgY2FuIGJlIHdyYXBwZWQgd2l0aCB0aGUgSUlGRVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHtib2R5LCBkaXJlY3RpdmVzfSA9IHBhdGgubm9kZTtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoLm5vZGUuZGlyZWN0aXZlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdGgubm9kZS5ib2R5ID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgaWlmZSB3cmFwcGVyIE5vZGVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB3cmFwcGVkQm9keSA9IHdyYXBwZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBCUk9XU0VSX0FSR1VNRU5UUzogaWlmZUFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIElNUE9SVF9OQU1FUzogaW5uZXJBcmdzXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLWJ1aWxkIHRoZSBwYXRoOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAtIEFkZCB0aGUgc3RhdGVtZW50cyB0aGF0IGVuc3VyZSB0aGUgZXhwb3J0IG5hbWVzcGFjZSBleGlzdHMgKGlmIHRoZSBtb2R1bGUgaGFzIGV4cG9ydHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gQWRkIHRoZSBJSUZFIHdyYXBwZXJcclxuICAgICAgICAgICAgICAgICAgICAvLyAgLSBRdWVyeSB0aGUgd3JhcHBlciB0byBnZXQgaXRzIGJvZHlcclxuICAgICAgICAgICAgICAgICAgICAvLyAgLSBBZGQgdGhlIGNhY2hlZCBkaXJlY3RpdmVzIGFuZCBvcmlnaW5hbCBib2R5IHRvIHRoZSBJSUZFIHdyYXBwZXJcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBleHBvcnRTdGF0ZW1lbnQgb2YgZXhwb3J0U3RhdGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2hDb250YWluZXIoXCJib2R5XCIsIGV4cG9ydFN0YXRlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVtZFdyYXBwZXIgPSBwYXRoLnB1c2hDb250YWluZXIoXCJib2R5XCIsIFt3cmFwcGVkQm9keV0pWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVtZEZhY3RvcnkgPSB1bWRXcmFwcGVyLmdldChcImV4cHJlc3Npb24uY2FsbGVlLmJvZHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdW1kRmFjdG9yeS5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBkaXJlY3RpdmVzKTtcclxuICAgICAgICAgICAgICAgICAgICB1bWRGYWN0b3J5LnB1c2hDb250YWluZXIoXCJib2R5XCIsIGJvZHkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==