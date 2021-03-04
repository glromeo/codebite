"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTransformers = void 0;
const path_1 = require("path");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const picomatch_1 = __importDefault(require("picomatch"));
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
const esbuild_transformer_1 = require("./esbuild-transformer");
const html_transformer_1 = require("./html-transformer");
const sass_transformer_1 = require("./sass-transformer");
exports.useTransformers = nano_memoize_1.default((options) => {
    var _a, _b;
    const { htmlTransformer } = html_transformer_1.useHtmlTransformer(options);
    const { esbuildTransformer } = esbuild_transformer_1.useEsBuildTransformer(options);
    const { babelTransformer } = babel_transformer_1.useBabelTransformer(options);
    const { sassTransformer } = sass_transformer_1.useSassTransformer(options);
    const include = ((_a = options.transform) === null || _a === void 0 ? void 0 : _a.include) && picomatch_1.default(options.transform.include);
    const exclude = ((_b = options.transform) === null || _b === void 0 ? void 0 : _b.exclude) && picomatch_1.default(options.transform.exclude);
    function shouldTransform({ headers, pathname, query }) {
        let should = (headers)["x-transformer"] !== "none" && (headers)["cache-control"] === "no-cache" || !!query.type;
        if (should) {
            should = !(include && !include(pathname) || exclude && exclude(pathname));
        }
        return should;
    }
    async function applyTransformer(filename, content, contentType, query) {
        switch (contentType) {
            case mime_types_1.HTML_CONTENT_TYPE:
                return htmlTransformer(filename, content);
            case mime_types_1.CSS_CONTENT_TYPE:
            case mime_types_1.SASS_CONTENT_TYPE:
            case mime_types_1.SCSS_CONTENT_TYPE:
                return sassTransformer(filename, content, query.type);
            case mime_types_1.JAVASCRIPT_CONTENT_TYPE:
            case mime_types_1.TYPESCRIPT_CONTENT_TYPE:
                if (options.babel) {
                    return babelTransformer(filename, content);
                }
                else {
                    return esbuildTransformer(filename, content);
                }
        }
    }
    async function transformContent(resource) {
        try {
            const hrtime = process.hrtime();
            const filename = resource.filename;
            const content = resource.content instanceof Buffer ? resource.content.toString("utf-8") : resource.content;
            const contentType = resource.headers["content-type"];
            const transformed = await applyTransformer(filename, content, contentType, resource.query);
            if (transformed) {
                resource.content = transformed.content;
                resource.headers["content-type"] = transformed.headers["content-type"];
                resource.headers["content-length"] = transformed.headers["content-length"];
                resource.headers["x-transformer"] = transformed.headers["x-transformer"];
                resource.headers["x-transform-duration"] = `${formatHrtime(process.hrtime(hrtime))}sec`;
                if (transformed.links) {
                    // TODO: check all the transformers to make sure this resolution is no longer necessary
                    const base = path_1.posix.dirname(resource.pathname);
                    resource.links = transformed.links.map(link => {
                        return path_1.posix.resolve(base, link);
                    });
                }
                if (transformed.includedFiles) {
                    resource.watch = transformed.includedFiles;
                }
                return transformed.map;
            }
        }
        catch (error) {
            error.message = `unable to transform: ${resource.filename}\n${error.message}`;
            throw error;
        }
    }
    function formatHrtime(hrtime) {
        return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    }
    return {
        shouldTransform,
        transformContent
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBb0M7QUFDcEMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7O0lBRS9ELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkYsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbkYsU0FBUyxlQUFlLENBQUMsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBVztRQUN6RCxJQUFJLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLFVBQVUsSUFBSSxD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QzNCLFFBQVEsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQztpQkFDOUM7Z0JBRUQsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDO2FBQzFCO1NBRUo7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLEtBQUssQ0FBQyxPQUFPLEdBQUcsd0JBQXdCLFFBQVEsQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlFLE1BQU0sS0FBSyxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUMsTUFBd0I7UUFDMUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsT0FBTztRQUNILGVBQWU7UUFDZixnQkFBZ0I7S0FDbkIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwb3NpeH0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBpY29tYXRjaCBmcm9tIFwicGljb21hdGNoXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge1Jlc291cmNlfSBmcm9tIFwiLi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XHJcbmltcG9ydCB7XHJcbiAgICBDU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgSFRNTF9DT05URU5UX1RZUEUsXHJcbiAgICBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSxcclxuICAgIFNBU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgU0NTU19DT05URU5UX1RZUEUsXHJcbiAgICBUWVBFU0NSSVBUX0NPTlRFTlRfVFlQRVxyXG59IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHt1c2VCYWJlbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9iYWJlbC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge3VzZUVzQnVpbGRUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vZXNidWlsZC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge3VzZUh0bWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vaHRtbC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge3VzZVNhc3NUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vc2Fzcy10cmFuc2Zvcm1lclwiO1xyXG5cclxuZXhwb3J0IHR5cGUgU291cmNlTWFwID0ge1xyXG4gICAgdmVyc2lvbjogbnVtYmVyO1xyXG4gICAgc291cmNlczogc3RyaW5nW107XHJcbiAgICBuYW1lczogc3RyaW5nW107XHJcbiAgICBzb3VyY2VSb290Pzogc3RyaW5nO1xyXG4gICAgc291cmNlc0NvbnRlbnQ/OiBzdHJpbmdbXTtcclxuICAgIG1hcHBpbmdzOiBzdHJpbmc7XHJcbiAgICBmaWxlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRyYW5zZm9ybWVyT3V0cHV0ID0ge1xyXG4gICAgY29udGVudDogc3RyaW5nXHJcbiAgICBtYXA/OiBTb3VyY2VNYXAgfCBudWxsO1xyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGVvZiBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSB8IHR5cGVvZiBIVE1MX0NPTlRFTlRfVFlQRSB8IHR5cGVvZiBDU1NfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogbnVtYmVyLFxyXG4gICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImJhYmVsLXRyYW5zZm9ybWVyXCIgfCBcInNhc3MtdHJhbnNmb3JtZXJcIiB8IFwiaHRtbC10cmFuc2Zvcm1lclwiIHwgXCJlc2J1aWxkLXRyYW5zZm9ybWVyXCJcclxuICAgIH0sXHJcbiAgICBsaW5rcz86IHN0cmluZ1tdIC8vIGFic29sdXRlIGZpbGVuYW1lcyBvZiBhbGwgaW1wb3J0ZWQgZmlsZXNcclxuICAgIGluY2x1ZGVkRmlsZXM/OiBzdHJpbmdbXSAgLy8gYWJzb2x1dGUgZmlsZW5hbWVzIG9mIGFsbCBpbmNsdWRlZCBmaWxlcyAoZS5nLiBzYXNzIGltcG9ydHMpXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB1c2VUcmFuc2Zvcm1lcnMgPSBtZW1vaXplZCgob3B0aW9uczogRVNOZXh0T3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtodG1sVHJhbnNmb3JtZXJ9ID0gdXNlSHRtbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge2VzYnVpbGRUcmFuc2Zvcm1lcn0gPSB1c2VFc0J1aWxkVHJhbnNmb3JtZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7YmFiZWxUcmFuc2Zvcm1lcn0gPSB1c2VCYWJlbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge3Nhc3NUcmFuc2Zvcm1lcn0gPSB1c2VTYXNzVHJhbnNmb3JtZXIob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3QgaW5jbHVkZSA9IG9wdGlvbnMudHJhbnNmb3JtPy5pbmNsdWRlICYmIHBpY29tYXRjaChvcHRpb25zLnRyYW5zZm9ybS5pbmNsdWRlKTtcclxuICAgIGNvbnN0IGV4Y2x1ZGUgPSBvcHRpb25zLnRyYW5zZm9ybT8uZXhjbHVkZSAmJiBwaWNvbWF0Y2gob3B0aW9ucy50cmFuc2Zvcm0uZXhjbHVkZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gc2hvdWxkVHJhbnNmb3JtKHtoZWFkZXJzLCBwYXRobmFtZSwgcXVlcnl9OiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGxldCBzaG91bGQgPSAoaGVhZGVycylbXCJ4LXRyYW5zZm9ybWVyXCJdICE9PSBcIm5vbmVcIiAmJiAoaGVhZGVycylbXCJjYWNoZS1jb250cm9sXCJdID09PSBcIm5vLWNhY2hlXCIgfHwgISFxdWVyeS50eXBlO1xyXG4gICAgICAgIGlmIChzaG91bGQpIHtcclxuICAgICAgICAgICAgc2hvdWxkID0gIShpbmNsdWRlICYmICFpbmNsdWRlKHBhdGhuYW1lKSB8fCBleGNsdWRlICYmIGV4Y2x1ZGUocGF0aG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNob3VsZDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBhcHBseVRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBjb250ZW50VHlwZSwgcXVlcnkpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0IHwgdm9pZD4ge1xyXG4gICAgICAgIHN3aXRjaCAoY29udGVudFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBIVE1MX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBodG1sVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBjYXNlIENTU19DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgIGNhc2UgU0FTU19DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgIGNhc2UgU0NTU19DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Fzc1RyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBxdWVyeS50eXBlKTtcclxuICAgICAgICAgICAgY2FzZSBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgY2FzZSBUWVBFU0NSSVBUX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmJhYmVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJhYmVsVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXNidWlsZFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gdHJhbnNmb3JtQ29udGVudChyZXNvdXJjZTogUmVzb3VyY2UpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBocnRpbWUgPSBwcm9jZXNzLmhydGltZSgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSByZXNvdXJjZS5maWxlbmFtZTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlc291cmNlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyByZXNvdXJjZS5jb250ZW50LnRvU3RyaW5nKFwidXRmLThcIikgOiByZXNvdXJjZS5jb250ZW50O1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl07XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGF3YWl0IGFwcGx5VHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlLCByZXNvdXJjZS5xdWVyeSk7XHJcbiAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IHRyYW5zZm9ybWVkLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl07XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl07XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wieC10cmFuc2Zvcm1lclwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybWVyXCJdO1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcIngtdHJhbnNmb3JtLWR1cmF0aW9uXCJdID0gYCR7Zm9ybWF0SHJ0aW1lKHByb2Nlc3MuaHJ0aW1lKGhydGltZSkpfXNlY2A7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkLmxpbmtzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgYWxsIHRoZSB0cmFuc2Zvcm1lcnMgdG8gbWFrZSBzdXJlIHRoaXMgcmVzb2x1dGlvbiBpcyBubyBsb25nZXIgbmVjZXNzYXJ5XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZSA9IHBvc2l4LmRpcm5hbWUocmVzb3VyY2UucGF0aG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLmxpbmtzID0gdHJhbnNmb3JtZWQubGlua3MubWFwKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zaXgucmVzb2x2ZShiYXNlLCBsaW5rKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtZWQuaW5jbHVkZWRGaWxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLndhdGNoID0gdHJhbnNmb3JtZWQuaW5jbHVkZWRGaWxlcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWQubWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgPSBgdW5hYmxlIHRvIHRyYW5zZm9ybTogJHtyZXNvdXJjZS5maWxlbmFtZX1cXG4ke2Vycm9yLm1lc3NhZ2V9YDtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZvcm1hdEhydGltZShocnRpbWU6IFtudW1iZXIsIG51bWJlcl0pIHtcclxuICAgICAgICByZXR1cm4gKGhydGltZVswXSArIChocnRpbWVbMV0gLyAxZTkpKS50b0ZpeGVkKDMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc2hvdWxkVHJhbnNmb3JtLFxyXG4gICAgICAgIHRyYW5zZm9ybUNvbnRlbnRcclxuICAgIH07XHJcbn0pOyJdfQ==