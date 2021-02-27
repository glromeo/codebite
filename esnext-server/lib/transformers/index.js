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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBbUM7QUFDbkMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFPLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7O0lBRTlELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsT0FBQSxPQUFPLENBQUMsU0FBUywwQ0FBRSxPQUFPLEtBQUksbUJBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25GLE1BQU0sT0FBTyxHQUFHLE9BQUEsT0FBTyxDQUFDLFNBQVMsMENBQUUsT0FBTyxLQUFJLG1CQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVuRixTQUFTLGVBQWUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFXO1FBQ3pELElBQUksTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsQ0FBQyxL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QUFDLEtBQUssR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO2lCQUM5QztnQkFFRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUM7YUFDMUI7U0FFSjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osS0FBSyxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUUsTUFBTSxLQUFLLENBQUM7U0FDZjtJQUNMLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxNQUF3QjtRQUMxQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtRQUNmLGdCQUFnQjtLQUNuQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3Bvc2l4fSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xuaW1wb3J0IHBpY29tYXRjaCBmcm9tIFwicGljb21hdGNoXCI7XG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcbmltcG9ydCB7UmVzb3VyY2V9IGZyb20gXCIuLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcbmltcG9ydCB7XG4gICAgQ1NTX0NPTlRFTlRfVFlQRSxcbiAgICBIVE1MX0NPTlRFTlRfVFlQRSxcbiAgICBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSxcbiAgICBTQVNTX0NPTlRFTlRfVFlQRSxcbiAgICBTQ1NTX0NPTlRFTlRfVFlQRSxcbiAgICBUWVBFU0NSSVBUX0NPTlRFTlRfVFlQRVxufSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XG5pbXBvcnQge3VzZUJhYmVsVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2JhYmVsLXRyYW5zZm9ybWVyXCI7XG5pbXBvcnQge3VzZUVzQnVpbGRUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vZXNidWlsZC10cmFuc2Zvcm1lclwiO1xuaW1wb3J0IHt1c2VIdG1sVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2h0bWwtdHJhbnNmb3JtZXJcIjtcbmltcG9ydCB7dXNlU2Fzc1RyYW5zZm9ybWVyfSBmcm9tIFwiLi9zYXNzLXRyYW5zZm9ybWVyXCI7XG5cbmV4cG9ydCB0eXBlIFNvdXJjZU1hcCA9IHtcbiAgICB2ZXJzaW9uOiBudW1iZXI7XG4gICAgc291cmNlczogc3RyaW5nW107XG4gICAgbmFtZXM6IHN0cmluZ1tdO1xuICAgIHNvdXJjZVJvb3Q/OiBzdHJpbmc7XG4gICAgc291cmNlc0NvbnRlbnQ/OiBzdHJpbmdbXTtcbiAgICBtYXBwaW5nczogc3RyaW5nO1xuICAgIGZpbGU6IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtZXJPdXRwdXQgPSB7XG4gICAgY29udGVudDogc3RyaW5nXG4gICAgbWFwPzogU291cmNlTWFwIHwgbnVsbDtcbiAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiY29udGVudC10eXBlXCI6IHR5cGVvZiBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSB8IHR5cGVvZiBIVE1MX0NPTlRFTlRfVFlQRSB8IHR5cGVvZiBDU1NfQ09OVEVOVF9UWVBFLFxuICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IG51bWJlcixcbiAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiYmFiZWwtdHJhbnNmb3JtZXJcIiB8IFwic2Fzcy10cmFuc2Zvcm1lclwiIHwgXCJodG1sLXRyYW5zZm9ybWVyXCIgfCBcImVzYnVpbGQtdHJhbnNmb3JtZXJcIlxuICAgIH0sXG4gICAgbGlua3M/OiBzdHJpbmdbXSAvLyBhYnNvbHV0ZSBmaWxlbmFtZXMgb2YgYWxsIGltcG9ydGVkIGZpbGVzXG4gICAgaW5jbHVkZWRGaWxlcz86IHN0cmluZ1tdICAvLyBhYnNvbHV0ZSBmaWxlbmFtZXMgb2YgYWxsIGluY2x1ZGVkIGZpbGVzIChlLmcuIHNhc3MgaW1wb3J0cylcbn1cblxuZXhwb3J0IGNvbnN0IHVzZVRyYW5zZm9ybWVycyA9IG1lbW9pemUoKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpID0+IHtcblxuICAgIGNvbnN0IHtodG1sVHJhbnNmb3JtZXJ9ID0gdXNlSHRtbFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtlc2J1aWxkVHJhbnNmb3JtZXJ9ID0gdXNlRXNCdWlsZFRyYW5zZm9ybWVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIob3B0aW9ucyk7XG4gICAgY29uc3Qge3Nhc3NUcmFuc2Zvcm1lcn0gPSB1c2VTYXNzVHJhbnNmb3JtZXIob3B0aW9ucyk7XG5cbiAgICBjb25zdCBpbmNsdWRlID0gb3B0aW9ucy50cmFuc2Zvcm0/LmluY2x1ZGUgJiYgcGljb21hdGNoKG9wdGlvbnMudHJhbnNmb3JtLmluY2x1ZGUpO1xuICAgIGNvbnN0IGV4Y2x1ZGUgPSBvcHRpb25zLnRyYW5zZm9ybT8uZXhjbHVkZSAmJiBwaWNvbWF0Y2gob3B0aW9ucy50cmFuc2Zvcm0uZXhjbHVkZSk7XG5cbiAgICBmdW5jdGlvbiBzaG91bGRUcmFuc2Zvcm0oe2hlYWRlcnMsIHBhdGhuYW1lLCBxdWVyeX06IFJlc291cmNlKSB7XG4gICAgICAgIGxldCBzaG91bGQgPSAoaGVhZGVycylbXCJ4LXRyYW5zZm9ybWVyXCJdICE9PSBcIm5vbmVcIiAmJiAoaGVhZGVycylbXCJjYWNoZS1jb250cm9sXCJdID09PSBcIm5vLWNhY2hlXCIgfHwgISFxdWVyeS50eXBlO1xuICAgICAgICBpZiAoc2hvdWxkKSB7XG4gICAgICAgICAgICBzaG91bGQgPSAhKGluY2x1ZGUgJiYgIWluY2x1ZGUocGF0aG5hbWUpIHx8IGV4Y2x1ZGUgJiYgZXhjbHVkZShwYXRobmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaG91bGQ7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gYXBwbHlUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCwgY29udGVudFR5cGUsIHF1ZXJ5KTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dCB8IHZvaWQ+IHtcbiAgICAgICAgc3dpdGNoIChjb250ZW50VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBIVE1MX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lLCBjb250ZW50KTtcbiAgICAgICAgICAgIGNhc2UgQ1NTX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgIGNhc2UgU0FTU19DT05URU5UX1RZUEU6XG4gICAgICAgICAgICBjYXNlIFNDU1NfQ09OVEVOVF9UWVBFOlxuICAgICAgICAgICAgICAgIHJldHVybiBzYXNzVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIHF1ZXJ5LnR5cGUpO1xuICAgICAgICAgICAgY2FzZSBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRTpcbiAgICAgICAgICAgIGNhc2UgVFlQRVNDUklQVF9DT05URU5UX1RZUEU6XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYmFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJhYmVsVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlc2J1aWxkVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybUNvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBocnRpbWUgPSBwcm9jZXNzLmhydGltZSgpO1xuXG4gICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHJlc291cmNlLmZpbGVuYW1lO1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlc291cmNlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyByZXNvdXJjZS5jb250ZW50LnRvU3RyaW5nKFwidXRmLThcIikgOiByZXNvdXJjZS5jb250ZW50O1xuICAgICAgICAgICAgY29uc3QgY29udGVudFR5cGUgPSByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IGF3YWl0IGFwcGx5VHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlLCByZXNvdXJjZS5xdWVyeSk7XG4gICAgICAgICAgICBpZiAodHJhbnNmb3JtZWQpIHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gdHJhbnNmb3JtZWQuY29udGVudDtcblxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPSB0cmFuc2Zvcm1lZC5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdO1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wieC10cmFuc2Zvcm1lclwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybWVyXCJdO1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybS1kdXJhdGlvblwiXSA9IGAke2Zvcm1hdEhydGltZShwcm9jZXNzLmhydGltZShocnRpbWUpKX1zZWNgO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkLmxpbmtzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGFsbCB0aGUgdHJhbnNmb3JtZXJzIHRvIG1ha2Ugc3VyZSB0aGlzIHJlc29sdXRpb24gaXMgbm8gbG9uZ2VyIG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlID0gcG9zaXguZGlybmFtZShyZXNvdXJjZS5wYXRobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLmxpbmtzID0gdHJhbnNmb3JtZWQubGlua3MubWFwKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc2l4LnJlc29sdmUoYmFzZSwgbGluayk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZC5pbmNsdWRlZEZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlLndhdGNoID0gdHJhbnNmb3JtZWQuaW5jbHVkZWRGaWxlcztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWQubWFwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gYHVuYWJsZSB0byB0cmFuc2Zvcm06ICR7cmVzb3VyY2UuZmlsZW5hbWV9XFxuJHtlcnJvci5tZXNzYWdlfWA7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEhydGltZShocnRpbWU6IFtudW1iZXIsIG51bWJlcl0pIHtcbiAgICAgICAgcmV0dXJuIChocnRpbWVbMF0gKyAoaHJ0aW1lWzFdIC8gMWU5KSkudG9GaXhlZCgzKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzaG91bGRUcmFuc2Zvcm0sXG4gICAgICAgIHRyYW5zZm9ybUNvbnRlbnRcbiAgICB9O1xufSk7Il19