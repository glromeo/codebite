"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTransformers = void 0;
const path_1 = require("path");
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const picomatch_1 = __importDefault(require("picomatch"));
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
const esbuild_transformer_1 = require("./esbuild-transformer");
const html_transformer_1 = require("./html-transformer");
const sass_transformer_1 = require("./sass-transformer");
exports.useTransformers = pico_memoize_1.default((options) => {
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
                resource.watch = transformed.includedFiles;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBbUM7QUFDbkMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFPLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7O0lBRTlELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsT0FBQSxPQUFPLENBQUMsU0FBUywwQ0FBRSxPQUFPLEtBQUksbUJBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25GLE1BQU0sT0FBTyxHQUFHLE9BQUEsT0FBTyxDQUFDLFNBQVMsMENBQUUsT0FBTyxLQUFJLG1CQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVuRixTQUFTLGVBQWUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFXO1FBQ3pELElBQUksTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsQ0FBQyxL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QztnQkFFM0MsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDO2FBQzFCO1NBRUo7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLEtBQUssQ0FBQyxPQUFPLEdBQUcsd0JBQXdCLFFBQVEsQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlFLE1BQU0sS0FBSyxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUMsTUFBd0I7UUFDMUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsT0FBTztRQUNILGVBQWU7UUFDZixnQkFBZ0I7S0FDbkIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwb3NpeH0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGljb21hdGNoIGZyb20gXCJwaWNvbWF0Y2hcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7UmVzb3VyY2V9IGZyb20gXCIuLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtcclxuICAgIENTU19DT05URU5UX1RZUEUsXHJcbiAgICBIVE1MX0NPTlRFTlRfVFlQRSxcclxuICAgIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxyXG4gICAgU0FTU19DT05URU5UX1RZUEUsXHJcbiAgICBTQ1NTX0NPTlRFTlRfVFlQRSxcclxuICAgIFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFXHJcbn0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZUJhYmVsVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2JhYmVsLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7dXNlRXNCdWlsZFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9lc2J1aWxkLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7dXNlSHRtbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9odG1sLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7dXNlU2Fzc1RyYW5zZm9ybWVyfSBmcm9tIFwiLi9zYXNzLXRyYW5zZm9ybWVyXCI7XHJcblxyXG5leHBvcnQgdHlwZSBTb3VyY2VNYXAgPSB7XHJcbiAgICB2ZXJzaW9uOiBudW1iZXI7XHJcbiAgICBzb3VyY2VzOiBzdHJpbmdbXTtcclxuICAgIG5hbWVzOiBzdHJpbmdbXTtcclxuICAgIHNvdXJjZVJvb3Q/OiBzdHJpbmc7XHJcbiAgICBzb3VyY2VzQ29udGVudD86IHN0cmluZ1tdO1xyXG4gICAgbWFwcGluZ3M6IHN0cmluZztcclxuICAgIGZpbGU6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtZXJPdXRwdXQgPSB7XHJcbiAgICBjb250ZW50OiBzdHJpbmdcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiB0eXBlb2YgSkFWQVNDUklQVF9DT05URU5UX1RZUEUgfCB0eXBlb2YgSFRNTF9DT05URU5UX1RZUEUgfCB0eXBlb2YgQ1NTX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IG51bWJlcixcclxuICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJiYWJlbC10cmFuc2Zvcm1lclwiIHwgXCJzYXNzLXRyYW5zZm9ybWVyXCIgfCBcImh0bWwtdHJhbnNmb3JtZXJcIiB8IFwiZXNidWlsZC10cmFuc2Zvcm1lclwiXHJcbiAgICB9LFxyXG4gICAgbWFwPzogU291cmNlTWFwIHwgbnVsbDtcclxuICAgIGxpbmtzPzogc3RyaW5nW11cclxuICAgIGluY2x1ZGVkRmlsZXM/OiBzdHJpbmdbXVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdXNlVHJhbnNmb3JtZXJzID0gbWVtb2l6ZSgob3B0aW9uczogRVNOZXh0T3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtodG1sVHJhbnNmb3JtZXJ9ID0gdXNlSHRtbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge2VzYnVpbGRUcmFuc2Zvcm1lcn0gPSB1c2VFc0J1aWxkVHJhbnNmb3JtZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7YmFiZWxUcmFuc2Zvcm1lcn0gPSB1c2VCYWJlbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge3Nhc3NUcmFuc2Zvcm1lcn0gPSB1c2VTYXNzVHJhbnNmb3JtZXIob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3QgaW5jbHVkZSA9IG9wdGlvbnMudHJhbnNmb3JtPy5pbmNsdWRlICYmIHBpY29tYXRjaChvcHRpb25zLnRyYW5zZm9ybS5pbmNsdWRlKTtcclxuICAgIGNvbnN0IGV4Y2x1ZGUgPSBvcHRpb25zLnRyYW5zZm9ybT8uZXhjbHVkZSAmJiBwaWNvbWF0Y2gob3B0aW9ucy50cmFuc2Zvcm0uZXhjbHVkZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gc2hvdWxkVHJhbnNmb3JtKHtoZWFkZXJzLCBwYXRobmFtZSwgcXVlcnl9OiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGxldCBzaG91bGQgPSAoaGVhZGVycylbXCJ4LXRyYW5zZm9ybWVyXCJdICE9PSBcIm5vbmVcIiAmJiAoaGVhZGVycylbXCJjYWNoZS1jb250cm9sXCJdID09PSBcIm5vLWNhY2hlXCIgfHwgISFxdWVyeS50eXBlO1xyXG4gICAgICAgIGlmIChzaG91bGQpIHtcclxuICAgICAgICAgICAgc2hvdWxkID0gIShpbmNsdWRlICYmICFpbmNsdWRlKHBhdGhuYW1lKSB8fCBleGNsdWRlICYmIGV4Y2x1ZGUocGF0aG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNob3VsZDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBhcHBseVRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBjb250ZW50VHlwZSwgcXVlcnkpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0IHwgdm9pZD4ge1xyXG4gICAgICAgIHN3aXRjaCAoY29udGVudFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBIVE1MX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBodG1sVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBjYXNlIENTU19DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgIGNhc2UgU0FTU19DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgIGNhc2UgU0NTU19DT05URU5UX1RZUEU6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Fzc1RyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50LCBxdWVyeS50eXBlKTtcclxuICAgICAgICAgICAgY2FzZSBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgY2FzZSBUWVBFU0NSSVBUX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmJhYmVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJhYmVsVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXNidWlsZFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gdHJhbnNmb3JtQ29udGVudChyZXNvdXJjZTogUmVzb3VyY2UpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBocnRpbWUgPSBwcm9jZXNzLmhydGltZSgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSByZXNvdXJjZS5maWxlbmFtZTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlc291cmNlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyByZXNvdXJjZS5jb250ZW50LnRvU3RyaW5nKFwidXRmLThcIikgOiByZXNvdXJjZS5jb250ZW50O1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl07XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGF3YWl0IGFwcGx5VHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlLCByZXNvdXJjZS5xdWVyeSk7XHJcbiAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IHRyYW5zZm9ybWVkLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl07XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl07XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wieC10cmFuc2Zvcm1lclwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybWVyXCJdO1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcIngtdHJhbnNmb3JtLWR1cmF0aW9uXCJdID0gYCR7Zm9ybWF0SHJ0aW1lKHByb2Nlc3MuaHJ0aW1lKGhydGltZSkpfXNlY2A7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkLmxpbmtzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgYWxsIHRoZSB0cmFuc2Zvcm1lcnMgdG8gbWFrZSBzdXJlIHRoaXMgcmVzb2x1dGlvbiBpcyBubyBsb25nZXIgbmVjZXNzYXJ5XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZSA9IHBvc2l4LmRpcm5hbWUocmVzb3VyY2UucGF0aG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLmxpbmtzID0gdHJhbnNmb3JtZWQubGlua3MubWFwKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zaXgucmVzb2x2ZShiYXNlLCBsaW5rKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS53YXRjaCA9IHRyYW5zZm9ybWVkLmluY2x1ZGVkRmlsZXM7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkLm1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gYHVuYWJsZSB0byB0cmFuc2Zvcm06ICR7cmVzb3VyY2UuZmlsZW5hbWV9XFxuJHtlcnJvci5tZXNzYWdlfWA7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmb3JtYXRIcnRpbWUoaHJ0aW1lOiBbbnVtYmVyLCBudW1iZXJdKSB7XHJcbiAgICAgICAgcmV0dXJuIChocnRpbWVbMF0gKyAoaHJ0aW1lWzFdIC8gMWU5KSkudG9GaXhlZCgzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNob3VsZFRyYW5zZm9ybSxcclxuICAgICAgICB0cmFuc2Zvcm1Db250ZW50XHJcbiAgICB9O1xyXG59KTsiXX0=