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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1iYWJlbC1wbHVnaW4taWlmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtYmFiZWwtcGx1Z2luLWlpZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBaUQ7QUFDakQsOEVBQThHO0FBQzlHLG9FQUFtRDtBQUVuRCwrQkFBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQUcsZUFBUSxDQUFDOzs7Q0FHeEIsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsNkJBQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNwQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJCLE1BQU0sRUFDRixLQUFLLEVBQ0wsaUJBQWlCLEVBQ2pCLE1BQU0sRUFDTixVQUFVLEVBQ1YsU0FBUyxFQUNULGVBQWUsRUFDZixlQUFlLEVBQ2Ysa0JBQWtCLEVBQ3JCLEdBQUcsT0FBTyxDQUFDO0lBRVosU0FBUyxvQkFBb0I7UUFDekIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbEUsSUFBSSxFQUFFLEdBQXNDLFlBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMvRCxPQUFPO1lBQ0gsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDMUIsRUFBRSxHQUFHLFlBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsWUFBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLFlBQUMsQ0FBQyxtQkFBbUIsQ0FDeEIsWUFBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsWUFBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxFQUFFLEVB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QUFHLEVBQUUsQ0FBQztvQkFFcEIsNEJBQTRCO29CQUM1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7d0JBQ3hCLGlCQUFpQixFQUFFLFFBQVE7d0JBQzNCLFlBQVksRUFBRSxTQUFTO3FCQUMxQixDQUFDLENBQUM7b0JBRUgscUJBQXFCO29CQUNyQiw0RkFBNEY7b0JBQzVGLDBCQUEwQjtvQkFDMUIsdUNBQXVDO29CQUN2QyxxRUFBcUU7b0JBQ3JFLEtBQUssSUFBSSxlQUFlLElBQUksZ0JBQWdCLEVBQUU7d0JBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO3FCQUMvQztvQkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDNUQsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzdDLFVBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO2FBQ0o7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dGVtcGxhdGUsIHR5cGVzIGFzIHR9IGZyb20gXCJAYmFiZWwvY29yZVwiO1xuaW1wb3J0IHtoYXNFeHBvcnRzLCBpc01vZHVsZSwgcmV3cml0ZU1vZHVsZVN0YXRlbWVudHNBbmRQcmVwYXJlSGVhZGVyfSBmcm9tIFwiQGJhYmVsL2hlbHBlci1tb2R1bGUtdHJhbnNmb3Jtc1wiO1xuaW1wb3J0IHtkZWNsYXJlfSBmcm9tIFwiQGJhYmVsL2hlbHBlci1wbHVnaW4tdXRpbHNcIjtcbmltcG9ydCB7SWRlbnRpZmllciwgTWVtYmVyRXhwcmVzc2lvbiwgVGhpc0V4cHJlc3Npb259IGZyb20gXCJAYmFiZWwvdHlwZXNcIjtcbmltcG9ydCB7cGFyc2UsIHJlc29sdmV9IGZyb20gXCJwYXRoXCI7XG5cbmNvbnN0IHdyYXBwZXIgPSB0ZW1wbGF0ZShgXG4gICAgKGZ1bmN0aW9uKElNUE9SVF9OQU1FUykge1xuICAgIH0pKEJST1dTRVJfQVJHVU1FTlRTKTtcbmApO1xuXG5leHBvcnQgZGVmYXVsdCBkZWNsYXJlKChhcGksIG9wdGlvbnMpID0+IHtcbiAgICBhcGkuYXNzZXJ0VmVyc2lvbig3KTtcblxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9vc2UsXG4gICAgICAgIGFsbG93VG9wTGV2ZWxUaGlzLFxuICAgICAgICBzdHJpY3QsXG4gICAgICAgIHN0cmljdE1vZGUsXG4gICAgICAgIG5vSW50ZXJvcCxcbiAgICAgICAgZXhwb3J0TmFtZXNwYWNlLFxuICAgICAgICBpbXBvcnROYW1lc3BhY2UsXG4gICAgICAgIGltcG9ydFJlbGF0aXZlUGF0aFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgZnVuY3Rpb24gYnVpbGRFeHBvcnROYW1lc3BhY2UoKSB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnMgPSBleHBvcnROYW1lc3BhY2UgPyBleHBvcnROYW1lc3BhY2Uuc3BsaXQoXCIuXCIpIDogW107XG4gICAgICAgIGxldCBpZDogTWVtYmVyRXhwcmVzc2lvbiB8IFRoaXNFeHByZXNzaW9uID0gdC50aGlzRXhwcmVzc2lvbigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXhwcmVzc2lvbjogaWQsXG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBtZW1iZXJzLm1hcChzZWcgPT4ge1xuICAgICAgICAgICAgICAgIGlkID0gdC5tZW1iZXJFeHByZXNzaW9uKGlkLCB0LmlkZW50aWZpZXIoc2VnKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQuZXhwcmVzc2lvblN0YXRlbWVudChcbiAgICAgICAgICAgICAgICAgICAgdC5hc3NpZ25tZW50RXhwcmVzc2lvbihcIj1cIiwgaWQsIHQubG9naWNhbEV4cHJlc3Npb24oXCJ8fFwiLCBpZCwgdC5vYmplY3RFeHByZXNzaW9uKFtdKSkpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRJbXBvcnROYW1lc3BhY2UoKSB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnMgPSBpbXBvcnROYW1lc3BhY2UgPyBpbXBvcnROYW1lc3BhY2Uuc3BsaXQoXCIuXCIpIDogW107XG4gICAgICAgIHJldHVybiBtZW1iZXJzLnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PiB0Lm1lbWJlckV4cHJlc3Npb24oYWNjLCB0LmlkZW50aWZpZXIoY3VycmVudCkpLCB0LnRoaXNFeHByZXNzaW9uKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkIHRoZSBtZW1iZXIgZXhwcmVzc2lvbiB0aGF0IHJlYWRzIGZyb20gYSBnbG9iYWwgZm9yIGEgZ2l2ZW4gc291cmNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJ1aWxkQnJvd3NlckFyZyhzb3VyY2UsIG5hbWVzcGFjZSkge1xuICAgICAgICBjb25zdCBpZFBhdGggPSBpbXBvcnRSZWxhdGl2ZVBhdGggPyByZXNvbHZlKGltcG9ydFJlbGF0aXZlUGF0aCwgc291cmNlKSA6IHNvdXJjZTtcbiAgICAgICAgY29uc3QgcGFydHMgPSBwYXJzZShpZFBhdGgpO1xuICAgICAgICByZXR1cm4gdC5tZW1iZXJFeHByZXNzaW9uKG5hbWVzcGFjZSwgdC5pZGVudGlmaWVyKHQudG9JZGVudGlmaWVyKGAke3BhcnRzLmRpcn0vJHtwYXJ0cy5uYW1lfWApKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmlzaXRvcjoge1xuICAgICAgICAgICAgUHJvZ3JhbToge1xuICAgICAgICAgICAgICAgIGV4aXQocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTW9kdWxlKHBhdGgpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge21ldGF9ID0gcmV3cml0ZU1vZHVsZVN0YXRlbWVudHNBbmRQcmVwYXJlSGVhZGVyKHBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvb3NlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0TW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93VG9wTGV2ZWxUaGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9JbnRlcm9wXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBhcmd1bWVudHMgb2YgdGhlIG91dGVyLCBJSUZFIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlpZmVBcmdzOiAoTWVtYmVyRXhwcmVzc2lvbiB8IFRoaXNFeHByZXNzaW9uKVtdID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGNvcnJlc3BvbmRpbmcgYXJndW1lbnRzIHRvIHRoZSBpbm5lciBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIElJRkVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5uZXJBcmdzOiBJZGVudGlmaWVyW10gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBleHBvcnRzIGFyZSBkZXRlY3RlZCwgc2V0IHVwIHRoZSBleHBvcnQgbmFtZXNwYWNlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4cG9ydFN0YXRlbWVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0V4cG9ydHMobWV0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydE5hbWVzcGFjZUluZm8gPSBidWlsZEV4cG9ydE5hbWVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0U3RhdGVtZW50cyA9IGV4cG9ydE5hbWVzcGFjZUluZm8uc3RhdGVtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlpZmVBcmdzLnB1c2goZXhwb3J0TmFtZXNwYWNlSW5mby5leHByZXNzaW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyQXJncy5wdXNoKHQuaWRlbnRpZmllcihtZXRhLmV4cG9ydE5hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgaW1wb3J0IG5hbWVzcGFjZSBhbmQgYnVpbGQgdXAgdGhlIDIgc2V0cyBvZiBhcmd1bWVudHMgYmFzZWQgb24gdGhlIG1vZHVsZSdzIGltcG9ydCBzdGF0ZW1lbnRzXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltcG9ydEV4cHJlc3Npb24gPSBidWlsZEltcG9ydE5hbWVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtzb3VyY2UsIG1ldGFkYXRhXSBvZiBtZXRhLnNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWlmZUFyZ3MucHVzaChidWlsZEJyb3dzZXJBcmcoc291cmNlLCBpbXBvcnRFeHByZXNzaW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbm5lckFyZ3MucHVzaCh0LmlkZW50aWZpZXIobWV0YWRhdGEubmFtZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2FjaGUgdGhlIG1vZHVsZSdzIGJvZHkgYW5kIGRpcmVjdGl2ZXMgYW5kIHRoZW4gY2xlYXIgdGhlbSBvdXQgc28gdGhleSBjYW4gYmUgd3JhcHBlZCB3aXRoIHRoZSBJSUZFXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHtib2R5LCBkaXJlY3RpdmVzfSA9IHBhdGgubm9kZTtcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5ub2RlLmRpcmVjdGl2ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5ub2RlLmJvZHkgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGlpZmUgd3JhcHBlciBOb2RlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHdyYXBwZWRCb2R5ID0gd3JhcHBlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICBCUk9XU0VSX0FSR1VNRU5UUzogaWlmZUFyZ3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBJTVBPUlRfTkFNRVM6IGlubmVyQXJnc1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZS1idWlsZCB0aGUgcGF0aDpcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gQWRkIHRoZSBzdGF0ZW1lbnRzIHRoYXQgZW5zdXJlIHRoZSBleHBvcnQgbmFtZXNwYWNlIGV4aXN0cyAoaWYgdGhlIG1vZHVsZSBoYXMgZXhwb3J0cylcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gQWRkIHRoZSBJSUZFIHdyYXBwZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gUXVlcnkgdGhlIHdyYXBwZXIgdG8gZ2V0IGl0cyBib2R5XG4gICAgICAgICAgICAgICAgICAgIC8vICAtIEFkZCB0aGUgY2FjaGVkIGRpcmVjdGl2ZXMgYW5kIG9yaWdpbmFsIGJvZHkgdG8gdGhlIElJRkUgd3JhcHBlclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBleHBvcnRTdGF0ZW1lbnQgb2YgZXhwb3J0U3RhdGVtZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBleHBvcnRTdGF0ZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVtZFdyYXBwZXIgPSBwYXRoLnB1c2hDb250YWluZXIoXCJib2R5XCIsIFt3cmFwcGVkQm9keV0pWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1bWRGYWN0b3J5ID0gdW1kV3JhcHBlci5nZXQoXCJleHByZXNzaW9uLmNhbGxlZS5ib2R5XCIpO1xuICAgICAgICAgICAgICAgICAgICB1bWRGYWN0b3J5LnB1c2hDb250YWluZXIoXCJib2R5XCIsIGRpcmVjdGl2ZXMpO1xuICAgICAgICAgICAgICAgICAgICB1bWRGYWN0b3J5LnB1c2hDb250YWluZXIoXCJib2R5XCIsIGJvZHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KTtcbiJdfQ==