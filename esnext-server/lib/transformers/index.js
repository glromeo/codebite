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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBb0M7QUFDcEMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7O0lBRS9ELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkYsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLE9BQU8sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sS0FBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbkYsU0FBUyxlQUFlLENBQUMsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBVztRQUN6RCxJQUFJLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLFVBQVUsSUFBSSxD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QzNCLFFBQVEsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQztpQkFDOUM7Z0JBRUQsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDO2FBQzFCO1NBRUo7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLEtBQUssQ0FBQyxPQUFPLEdBQUcsd0JBQXdCLFFBQVEsQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlFLE1BQU0sS0FBSyxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUMsTUFBd0I7UUFDMUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsT0FBTztRQUNILGVBQWU7UUFDZixnQkFBZ0I7S0FDbkIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwb3NpeH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgcGljb21hdGNoIGZyb20gXCJwaWNvbWF0Y2hcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtSZXNvdXJjZX0gZnJvbSBcIi4uL3Byb3ZpZGVycy9yZXNvdXJjZS1wcm92aWRlclwiO1xuaW1wb3J0IHtcbiAgICBDU1NfQ09OVEVOVF9UWVBFLFxuICAgIEhUTUxfQ09OVEVOVF9UWVBFLFxuICAgIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxuICAgIFNBU1NfQ09OVEVOVF9UWVBFLFxuICAgIFNDU1NfQ09OVEVOVF9UWVBFLFxuICAgIFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFXG59IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7dXNlQmFiZWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vYmFiZWwtdHJhbnNmb3JtZXJcIjtcbmltcG9ydCB7dXNlRXNCdWlsZFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9lc2J1aWxkLXRyYW5zZm9ybWVyXCI7XG5pbXBvcnQge3VzZUh0bWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vaHRtbC10cmFuc2Zvcm1lclwiO1xuaW1wb3J0IHt1c2VTYXNzVHJhbnNmb3JtZXJ9IGZyb20gXCIuL3Nhc3MtdHJhbnNmb3JtZXJcIjtcblxuZXhwb3J0IHR5cGUgU291cmNlTWFwID0ge1xuICAgIHZlcnNpb246IG51bWJlcjtcbiAgICBzb3VyY2VzOiBzdHJpbmdbXTtcbiAgICBuYW1lczogc3RyaW5nW107XG4gICAgc291cmNlUm9vdD86IHN0cmluZztcbiAgICBzb3VyY2VzQ29udGVudD86IHN0cmluZ1tdO1xuICAgIG1hcHBpbmdzOiBzdHJpbmc7XG4gICAgZmlsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1lck91dHB1dCA9IHtcbiAgICBjb250ZW50OiBzdHJpbmdcbiAgICBtYXA/OiBTb3VyY2VNYXAgfCBudWxsO1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJjb250ZW50LXR5cGVcIjogdHlwZW9mIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFIHwgdHlwZW9mIEhUTUxfQ09OVEVOVF9UWVBFIHwgdHlwZW9mIENTU19DT05URU5UX1RZUEUsXG4gICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogbnVtYmVyLFxuICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJiYWJlbC10cmFuc2Zvcm1lclwiIHwgXCJzYXNzLXRyYW5zZm9ybWVyXCIgfCBcImh0bWwtdHJhbnNmb3JtZXJcIiB8IFwiZXNidWlsZC10cmFuc2Zvcm1lclwiXG4gICAgfSxcbiAgICBsaW5rcz86IHN0cmluZ1tdIC8vIGFic29sdXRlIGZpbGVuYW1lcyBvZiBhbGwgaW1wb3J0ZWQgZmlsZXNcbiAgICBpbmNsdWRlZEZpbGVzPzogc3RyaW5nW10gIC8vIGFic29sdXRlIGZpbGVuYW1lcyBvZiBhbGwgaW5jbHVkZWQgZmlsZXMgKGUuZy4gc2FzcyBpbXBvcnRzKVxufVxuXG5leHBvcnQgY29uc3QgdXNlVHJhbnNmb3JtZXJzID0gbWVtb2l6ZWQoKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpID0+IHtcblxuICAgIGNvbnN0IHtodG1sVHJhbnNmb3JtZXJ9ID0gdXNlSHRtbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtlc2J1aWxkVHJhbnNmb3JtZXJ9ID0gdXNlRXNCdWlsZFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIob3B0aW9ucyk7XG4gICAgY29uc3Qge3Nhc3NUcmFuc2Zvcm1lcn0gPSB1c2VTYXNzVHJhbnNmb3JtZXIob3B0aW9ucyk7XG5cbiAgICBjb25zdCBpbmNsdWRlID0gb3B0aW9ucy50cmFuc2Zvcm0/LmluY2x1ZGUgJiYgcGljb21hdGNoKG9wdGlvbnMudHJhbnNmb3JtLmluY2x1ZGUpO1xuICAgIGNvbnN0IGV4Y2x1ZGUgPSBvcHRpb25zLnRyYW5zZm9ybT8uZXhjbHVkZSAmJiBwaWNvbWF0Y2gob3B0aW9ucy50cmFuc2Zvcm0uZXhjbHVkZSk7XG5cbiAgICBmdW5jdGlvbiBzaG91bGRUcmFuc2Zvcm0oe2hlYWRlcnMsIHBhdGhuYW1lLCBxdWVyeX06IFJlc291cmNlKSB7XG4gICAgICAgIGxldCBzaG91bGQgPSAoaGVhZGVycylbXCJ4LXRyYW5zZm9ybWVyXCJdICE9PSBcIm5vbmVcIiAmJiAoaGVhZGVycylbXCJjYWNoZS1jb250cm9sXCJdID09PSBcIm5vLWNhY2hlXCIgfHwgISFxdWVyeS50eXBlO1xuICAgICAgICBpZiAoc2hvdWxkKSB7XG4gICAgICAgICAgICBzaG91bGQgPSAhKGluY2x1ZGUgJiYgIWluY2x1ZGUocGF0aG5hbWUpIHx8IGV4Y2x1ZGUgJiYgZXhjbHVkZShwYXRobmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaG91bGQ7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gYXBwbHlUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCwgY29udGVudFR5cGUsIHF1ZXJ5KTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dCB8IHZvaWQ+IHtcbiAgICAgICAgc3dpdGNoIChjb250ZW50VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBIVE1MX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcbiAgICAgICAgICAgIGNhc2UgQ1NTX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgIGNhc2UgU0FTU19DT05URU5UX1RZUEU6XG4gICAgICAgICAgICBjYXNlIFNDU1NfQ09OVEVOVF9UWVBFOlxuICAgICAgICAgICAgICAgIHJldHVybiBzYXNzVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIHF1ZXJ5LnR5cGUpO1xuICAgICAgICAgICAgY2FzZSBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgIGNhc2UgVFlQRVNDUklQVF9DT05URU5UX1RZUEU6XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYmFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJhYmVsVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlc2J1aWxkVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybUNvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBocnRpbWUgPSBwcm9jZXNzLmhydGltZSgpO1xuXG4gICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHJlc291cmNlLmZpbGVuYW1lO1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlc291cmNlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyByZXNvdXJjZS5jb250ZW50LnRvU3RyaW5nKFwidXRmLThcIikgOiByZXNvdXJjZS5jb250ZW50O1xuICAgICAgICAgICAgY29uc3QgY29udGVudFR5cGUgPSByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGF3YWl0IGFwcGx5VHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlLCByZXNvdXJjZS5xdWVyeSk7XG4gICAgICAgICAgICBpZiAodHJhbnNmb3JtZWQpIHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gdHJhbnNmb3JtZWQuY29udGVudDtcblxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdO1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wieC10cmFuc2Zvcm1lclwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybWVyXCJdO1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybS1kdXJhdGlvblwiXSA9IGAke2Zvcm1hdEhydGltZShwcm9jZXNzLmhydGltZShocnRpbWUpKX1zZWNgO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkLmxpbmtzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGFsbCB0aGUgdHJhbnNmb3JtZXJzIHRvIG1ha2Ugc3VyZSB0aGlzIHJlc29sdXRpb24gaXMgbm8gbG9uZ2VyIG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlID0gcG9zaXguZGlybmFtZShyZXNvdXJjZS5wYXRobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLmxpbmtzID0gdHJhbnNmb3JtZWQubGlua3MubWFwKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc2l4LnJlc29sdmUoYmFzZSwgbGluayk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZC5pbmNsdWRlZEZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLndhdGNoID0gdHJhbnNmb3JtZWQuaW5jbHVkZWRGaWxlcztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWQubWFwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gYHVuYWJsZSB0byB0cmFuc2Zvcm06ICR7cmVzb3VyY2UuZmlsZW5hbWV9XFxuJHtlcnJvci5tZXNzYWdlfWA7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEhydGltZShocnRpbWU6IFtudW1iZXIsIG51bWJlcl0pIHtcbiAgICAgICAgcmV0dXJuIChocnRpbWVbMF0gKyAoaHJ0aW1lWzFdIC8gMWU5KSkudG9GaXhlZCgzKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzaG91bGRUcmFuc2Zvcm0sXG4gICAgICAgIHRyYW5zZm9ybUNvbnRlbnRcbiAgICB9O1xufSk7Il19