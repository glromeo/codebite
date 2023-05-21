"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const helper_module_transforms_1 = require("@babel/helper-module-transforms");
const helper_plugin_utils_1 = require("@babel/helper-plugin-utils");
const path_1 = require("path");
const wrapper = (0, core_1.template)(`
    (function(IMPORT_NAMES) {
    })(BROWSER_ARGUMENTS);
`);
exports.default = (0, helper_plugin_utils_1.declare)((api, options) => {
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
        const idPath = importRelativePath ? (0, path_1.resolve)(importRelativePath, source) : source;
        const parts = (0, path_1.parse)(idPath);
        return core_1.types.memberExpression(namespace, core_1.types.identifier(core_1.types.toIdentifier(`${parts.dir}/${parts.name}`)));
    }
    return {
        visitor: {
            Program: {
                exit(path) {
                    if (!(0, helper_module_transforms_1.isModule)(path))
                        return;
                    const { meta } = (0, helper_module_transforms_1.rewriteModuleStatementsAndPrepareHeader)(path, {
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
                    if ((0, helper_module_transforms_1.hasExports)(meta)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1iYWJlbC1wbHVnaW4taWlmZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtYmFiZWwtcGx1Z2luLWlpZmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBaUQ7QUFDakQsOEVBQThHO0FBQzlHLG9FQUFtRDtBQUNuRCwrQkFBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQUcsSUFBQSxlQUFRLEVBQUM7OztDQUd4QixDQUFDLENBQUM7QUFFSCxrQkFBZSxJQUFBLDZCQUFPLEVBQUMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDcEMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVyQixNQUFNLEVBQ0YsS0FBSyxFQUNMLGlCQUFpQixFQUNqQixNQUFNLEVBQ04sVUFBVSxFQUNWLFNBQVMsRUFDVCxlQUFlLEVBQ2YsZUFBZSxFQUNmLGtCQUFrQixFQUNyQixHQUFHLE9BQU8sQ0FBQztJQUVaLFNBQVMsb0JBQW9CO1FBQ3pCLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2xFLElBQUksRUFBRSxHQUEwQyxZQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDbkUsT0FBTztZQUNILFVBQVUsRUFBRSxFQUFFO1lBQ2QsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzFCLEVBQUUsR0FBRyxZQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLFlBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsT0FBTyxZQUFDLENBQUMsbUJBQW1CLENBQ3hCLFlBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLFlBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVB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QztvQkFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUVwQiw0QkFBNEI7b0JBQzVCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQzt3QkFDeEIsaUJBQWlCLEVBQUUsUUFBUTt3QkFDM0IsWUFBWSxFQUFFLFNBQVM7cUJBQzFCLENBQUMsQ0FBQztvQkFFSCxxQkFBcUI7b0JBQ3JCLDRGQUE0RjtvQkFDNUYsMEJBQTBCO29CQUMxQix1Q0FBdUM7b0JBQ3ZDLHFFQUFxRTtvQkFDckUsS0FBSyxJQUFJLGVBQWUsSUFBSSxnQkFBZ0IsRUFBRTt3QkFDMUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUM7cUJBQy9DO29CQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEUsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO29CQUM1RCxVQUFVLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDN0MsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNDLENBQUM7YUFDSjtTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHt0ZW1wbGF0ZSwgdHlwZXMgYXMgdH0gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCB7aGFzRXhwb3J0cywgaXNNb2R1bGUsIHJld3JpdGVNb2R1bGVTdGF0ZW1lbnRzQW5kUHJlcGFyZUhlYWRlcn0gZnJvbSBcIkBiYWJlbC9oZWxwZXItbW9kdWxlLXRyYW5zZm9ybXNcIjtcclxuaW1wb3J0IHtkZWNsYXJlfSBmcm9tIFwiQGJhYmVsL2hlbHBlci1wbHVnaW4tdXRpbHNcIjtcclxuaW1wb3J0IHtwYXJzZSwgcmVzb2x2ZX0gZnJvbSBcInBhdGhcIjtcclxuXHJcbmNvbnN0IHdyYXBwZXIgPSB0ZW1wbGF0ZShgXHJcbiAgICAoZnVuY3Rpb24oSU1QT1JUX05BTUVTKSB7XHJcbiAgICB9KShCUk9XU0VSX0FSR1VNRU5UUyk7XHJcbmApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVjbGFyZSgoYXBpLCBvcHRpb25zKSA9PiB7XHJcbiAgICBhcGkuYXNzZXJ0VmVyc2lvbig3KTtcclxuXHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgbG9vc2UsXHJcbiAgICAgICAgYWxsb3dUb3BMZXZlbFRoaXMsXHJcbiAgICAgICAgc3RyaWN0LFxyXG4gICAgICAgIHN0cmljdE1vZGUsXHJcbiAgICAgICAgbm9JbnRlcm9wLFxyXG4gICAgICAgIGV4cG9ydE5hbWVzcGFjZSxcclxuICAgICAgICBpbXBvcnROYW1lc3BhY2UsXHJcbiAgICAgICAgaW1wb3J0UmVsYXRpdmVQYXRoXHJcbiAgICB9ID0gb3B0aW9ucztcclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZEV4cG9ydE5hbWVzcGFjZSgpIHtcclxuICAgICAgICBjb25zdCBtZW1iZXJzID0gZXhwb3J0TmFtZXNwYWNlID8gZXhwb3J0TmFtZXNwYWNlLnNwbGl0KFwiLlwiKSA6IFtdO1xyXG4gICAgICAgIGxldCBpZDogdC5NZW1iZXJFeHByZXNzaW9uIHwgdC5UaGlzRXhwcmVzc2lvbiA9IHQudGhpc0V4cHJlc3Npb24oKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBleHByZXNzaW9uOiBpZCxcclxuICAgICAgICAgICAgc3RhdGVtZW50czogbWVtYmVycy5tYXAoc2VnID0+IHtcclxuICAgICAgICAgICAgICAgIGlkID0gdC5tZW1iZXJFeHByZXNzaW9uKGlkLCB0LmlkZW50aWZpZXIoc2VnKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdC5leHByZXNzaW9uU3RhdGVtZW50KFxyXG4gICAgICAgICAgICAgICAgICAgIHQuYXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIGlkLCB0LmxvZ2ljYWxFeHByZXNzaW9uKFwifHxcIiwgaWQsIHQub2JqZWN0RXhwcmVzc2lvbihbXSkpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkSW1wb3J0TmFtZXNwYWNlKCkge1xyXG4gICAgICAgIGNvbnN0IG1lbWJlcnMgPSBpbXBvcnROYW1lc3BhY2UgPyBpbXBvcnROYW1lc3BhY2Uuc3BsaXQoXCIuXCIpIDogW107XHJcbiAgICAgICAgcmV0dXJuIG1lbWJlcnMucmVkdWNlKChhY2MsIGN1cnJlbnQpID0+IHQubWVtYmVyRXhwcmVzc2lvbihhY2MsIHQuaWRlbnRpZmllcihjdXJyZW50KSksIHQudGhpc0V4cHJlc3Npb24oKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCdWlsZCB0aGUgbWVtYmVyIGV4cHJlc3Npb24gdGhhdCByZWFkcyBmcm9tIGEgZ2xvYmFsIGZvciBhIGdpdmVuIHNvdXJjZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYnVpbGRCcm93c2VyQXJnKHNvdXJjZSwgbmFtZXNwYWNlKSB7XHJcbiAgICAgICAgY29uc3QgaWRQYXRoID0gaW1wb3J0UmVsYXRpdmVQYXRoID8gcmVzb2x2ZShpbXBvcnRSZWxhdGl2ZVBhdGgsIHNvdXJjZSkgOiBzb3VyY2U7XHJcbiAgICAgICAgY29uc3QgcGFydHMgPSBwYXJzZShpZFBhdGgpO1xyXG4gICAgICAgIHJldHVybiB0Lm1lbWJlckV4cHJlc3Npb24obmFtZXNwYWNlLCB0LmlkZW50aWZpZXIodC50b0lkZW50aWZpZXIoYCR7cGFydHMuZGlyfS8ke3BhcnRzLm5hbWV9YCkpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZpc2l0b3I6IHtcclxuICAgICAgICAgICAgUHJvZ3JhbToge1xyXG4gICAgICAgICAgICAgICAgZXhpdChwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01vZHVsZShwYXRoKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7bWV0YX0gPSByZXdyaXRlTW9kdWxlU3RhdGVtZW50c0FuZFByZXBhcmVIZWFkZXIocGF0aCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb29zZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpY3RNb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd1RvcExldmVsVGhpcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9JbnRlcm9wXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBhcmd1bWVudHMgb2YgdGhlIG91dGVyLCBJSUZFIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaWlmZUFyZ3M6ICh0Lk1lbWJlckV4cHJlc3Npb24gfCB0LlRoaXNFeHByZXNzaW9uKVtdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb3JyZXNwb25kaW5nIGFyZ3VtZW50cyB0byB0aGUgaW5uZXIgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBJSUZFXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5uZXJBcmdzOiB0LklkZW50aWZpZXJbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBleHBvcnRzIGFyZSBkZXRlY3RlZCwgc2V0IHVwIHRoZSBleHBvcnQgbmFtZXNwYWNlIGluZm9cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXhwb3J0U3RhdGVtZW50cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNFeHBvcnRzKG1ldGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4cG9ydE5hbWVzcGFjZUluZm8gPSBidWlsZEV4cG9ydE5hbWVzcGFjZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRTdGF0ZW1lbnRzID0gZXhwb3J0TmFtZXNwYWNlSW5mby5zdGF0ZW1lbnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpaWZlQXJncy5wdXNoKGV4cG9ydE5hbWVzcGFjZUluZm8uZXhwcmVzc2lvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyQXJncy5wdXNoKHQuaWRlbnRpZmllcihtZXRhLmV4cG9ydE5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgaW1wb3J0IG5hbWVzcGFjZSBhbmQgYnVpbGQgdXAgdGhlIDIgc2V0cyBvZiBhcmd1bWVudHMgYmFzZWQgb24gdGhlIG1vZHVsZSdzIGltcG9ydCBzdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0RXhwcmVzc2lvbiA9IGJ1aWxkSW1wb3J0TmFtZXNwYWNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbc291cmNlLCBtZXRhZGF0YV0gb2YgbWV0YS5zb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWlmZUFyZ3MucHVzaChidWlsZEJyb3dzZXJBcmcoc291cmNlLCBpbXBvcnRFeHByZXNzaW9uKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyQXJncy5wdXNoKHQuaWRlbnRpZmllcihtZXRhZGF0YS5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDYWNoZSB0aGUgbW9kdWxlJ3MgYm9keSBhbmQgZGlyZWN0aXZlcyBhbmQgdGhlbiBjbGVhciB0aGVtIG91dCBzbyB0aGV5IGNhbiBiZSB3cmFwcGVkIHdpdGggdGhlIElJRkVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7Ym9keSwgZGlyZWN0aXZlc30gPSBwYXRoLm5vZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5ub2RlLmRpcmVjdGl2ZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoLm5vZGUuYm9keSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGlpZmUgd3JhcHBlciBOb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgd3JhcHBlZEJvZHkgPSB3cmFwcGVyKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgQlJPV1NFUl9BUkdVTUVOVFM6IGlpZmVBcmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBJTVBPUlRfTkFNRVM6IGlubmVyQXJnc1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZS1idWlsZCB0aGUgcGF0aDpcclxuICAgICAgICAgICAgICAgICAgICAvLyAgLSBBZGQgdGhlIHN0YXRlbWVudHMgdGhhdCBlbnN1cmUgdGhlIGV4cG9ydCBuYW1lc3BhY2UgZXhpc3RzIChpZiB0aGUgbW9kdWxlIGhhcyBleHBvcnRzKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAtIEFkZCB0aGUgSUlGRSB3cmFwcGVyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gUXVlcnkgdGhlIHdyYXBwZXIgdG8gZ2V0IGl0cyBib2R5XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gIC0gQWRkIHRoZSBjYWNoZWQgZGlyZWN0aXZlcyBhbmQgb3JpZ2luYWwgYm9keSB0byB0aGUgSUlGRSB3cmFwcGVyXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZXhwb3J0U3RhdGVtZW50IG9mIGV4cG9ydFN0YXRlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBleHBvcnRTdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1bWRXcmFwcGVyID0gcGF0aC5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBbd3JhcHBlZEJvZHldKVswXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1bWRGYWN0b3J5ID0gdW1kV3JhcHBlci5nZXQoXCJleHByZXNzaW9uLmNhbGxlZS5ib2R5XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHVtZEZhY3RvcnkucHVzaENvbnRhaW5lcihcImJvZHlcIiwgZGlyZWN0aXZlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdW1kRmFjdG9yeS5wdXNoQ29udGFpbmVyKFwiYm9keVwiLCBib2R5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pO1xyXG4iXX0=