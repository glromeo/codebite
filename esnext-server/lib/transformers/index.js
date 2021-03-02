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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUEyQjtBQUMzQixnRUFBb0M7QUFDcEMsMERBQWtDO0FBR2xDLG1EQU80QjtBQUM1QiwyREFBd0Q7QUFDeEQsK0RBQTREO0FBQzVELHlEQUFzRDtBQUN0RCx5REFBc0Q7QUF3QnpDLFFBQUEsZUFBZSxHQUFHLHNCQUFRLENBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7O0lBRS9ELE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxxQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUMsa0JBQWtCLEVBQUMsR0FBRywyQ0FBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxNQUFNLEVBQUMsZUFBZSxFQUFDLEdBQUcscUNBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdEQsTUFBTSxPQUFPLEdBQUcsT0FBQSxPQUFPLENBQUMsU0FBUywwQ0FBRSxPQUFPLEtBQUksbUJBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25GLE1BQU0sT0FBTyxHQUFHLE9BQUEsT0FBTyxDQUFDLFNBQVMsMENBQUUsT0FBTyxLQUFJLG1CQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVuRixTQUFTLGVBQWUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFXO1FBQ3pELElBQUksTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsQ0FBQyxL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QUFDLEtBQUssR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO2lCQUM5QztnQkFFRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUM7YUFDMUI7U0FFSjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osS0FBSyxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUUsTUFBTSxLQUFLLENBQUM7U0FDZjtJQUNMLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxNQUF3QjtRQUMxQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtRQUNmLGdCQUFnQjtLQUNuQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3Bvc2l4fSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGljb21hdGNoIGZyb20gXCJwaWNvbWF0Y2hcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7UmVzb3VyY2V9IGZyb20gXCIuLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtcclxuICAgIENTU19DT05URU5UX1RZUEUsXHJcbiAgICBIVE1MX0NPTlRFTlRfVFlQRSxcclxuICAgIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxyXG4gICAgU0FTU19DT05URU5UX1RZUEUsXHJcbiAgICBTQ1NTX0NPTlRFTlRfVFlQRSxcclxuICAgIFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFXHJcbn0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZUJhYmVsVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2JhYmVsLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7dXNlRXNCdWlsZFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9lc2J1aWxkLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7dXNlSHRtbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9odG1sLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7dXNlU2Fzc1RyYW5zZm9ybWVyfSBmcm9tIFwiLi9zYXNzLXRyYW5zZm9ybWVyXCI7XHJcblxyXG5leHBvcnQgdHlwZSBTb3VyY2VNYXAgPSB7XHJcbiAgICB2ZXJzaW9uOiBudW1iZXI7XHJcbiAgICBzb3VyY2VzOiBzdHJpbmdbXTtcclxuICAgIG5hbWVzOiBzdHJpbmdbXTtcclxuICAgIHNvdXJjZVJvb3Q/OiBzdHJpbmc7XHJcbiAgICBzb3VyY2VzQ29udGVudD86IHN0cmluZ1tdO1xyXG4gICAgbWFwcGluZ3M6IHN0cmluZztcclxuICAgIGZpbGU6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtZXJPdXRwdXQgPSB7XHJcbiAgICBjb250ZW50OiBzdHJpbmdcclxuICAgIG1hcD86IFNvdXJjZU1hcCB8IG51bGw7XHJcbiAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJjb250ZW50LXR5cGVcIjogdHlwZW9mIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFIHwgdHlwZW9mIEhUTUxfQ09OVEVOVF9UWVBFIHwgdHlwZW9mIENTU19DT05URU5UX1RZUEUsXHJcbiAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBudW1iZXIsXHJcbiAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiYmFiZWwtdHJhbnNmb3JtZXJcIiB8IFwic2Fzcy10cmFuc2Zvcm1lclwiIHwgXCJodG1sLXRyYW5zZm9ybWVyXCIgfCBcImVzYnVpbGQtdHJhbnNmb3JtZXJcIlxyXG4gICAgfSxcclxuICAgIGxpbmtzPzogc3RyaW5nW10gLy8gYWJzb2x1dGUgZmlsZW5hbWVzIG9mIGFsbCBpbXBvcnRlZCBmaWxlc1xyXG4gICAgaW5jbHVkZWRGaWxlcz86IHN0cmluZ1tdICAvLyBhYnNvbHV0ZSBmaWxlbmFtZXMgb2YgYWxsIGluY2x1ZGVkIGZpbGVzIChlLmcuIHNhc3MgaW1wb3J0cylcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVRyYW5zZm9ybWVycyA9IG1lbW9pemVkKChvcHRpb25zOiBFU05leHRPcHRpb25zKSA9PiB7XHJcblxyXG4gICAgY29uc3Qge2h0bWxUcmFuc2Zvcm1lcn0gPSB1c2VIdG1sVHJhbnNmb3JtZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7ZXNidWlsZFRyYW5zZm9ybWVyfSA9IHVzZUVzQnVpbGRUcmFuc2Zvcm1lcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7c2Fzc1RyYW5zZm9ybWVyfSA9IHVzZVNhc3NUcmFuc2Zvcm1lcihvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCBpbmNsdWRlID0gb3B0aW9ucy50cmFuc2Zvcm0/LmluY2x1ZGUgJiYgcGljb21hdGNoKG9wdGlvbnMudHJhbnNmb3JtLmluY2x1ZGUpO1xyXG4gICAgY29uc3QgZXhjbHVkZSA9IG9wdGlvbnMudHJhbnNmb3JtPy5leGNsdWRlICYmIHBpY29tYXRjaChvcHRpb25zLnRyYW5zZm9ybS5leGNsdWRlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBzaG91bGRUcmFuc2Zvcm0oe2hlYWRlcnMsIHBhdGhuYW1lLCBxdWVyeX06IFJlc291cmNlKSB7XHJcbiAgICAgICAgbGV0IHNob3VsZCA9IChoZWFkZXJzKVtcIngtdHJhbnNmb3JtZXJcIl0gIT09IFwibm9uZVwiICYmIChoZWFkZXJzKVtcImNhY2hlLWNvbnRyb2xcIl0gPT09IFwibm8tY2FjaGVcIiB8fCAhIXF1ZXJ5LnR5cGU7XHJcbiAgICAgICAgaWYgKHNob3VsZCkge1xyXG4gICAgICAgICAgICBzaG91bGQgPSAhKGluY2x1ZGUgJiYgIWluY2x1ZGUocGF0aG5hbWUpIHx8IGV4Y2x1ZGUgJiYgZXhjbHVkZShwYXRobmFtZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2hvdWxkO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlLCBxdWVyeSk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQgfCB2b2lkPiB7XHJcbiAgICAgICAgc3dpdGNoIChjb250ZW50VHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIEhUTUxfQ09OVEVOVF9UWVBFOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWxUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgICAgIGNhc2UgQ1NTX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgY2FzZSBTQVNTX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgY2FzZSBTQ1NTX0NPTlRFTlRfVFlQRTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBzYXNzVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQsIHF1ZXJ5LnR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFOlxyXG4gICAgICAgICAgICBjYXNlIFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFOlxyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYmFiZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmFiZWxUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlc2J1aWxkVHJhbnNmb3JtZXIoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1Db250ZW50KHJlc291cmNlOiBSZXNvdXJjZSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhydGltZSA9IHByb2Nlc3MuaHJ0aW1lKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHJlc291cmNlLmZpbGVuYW1lO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gcmVzb3VyY2UuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IHJlc291cmNlLmNvbnRlbnQudG9TdHJpbmcoXCJ1dGYtOFwiKSA6IHJlc291cmNlLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gYXdhaXQgYXBwbHlUcmFuc2Zvcm1lcihmaWxlbmFtZSwgY29udGVudCwgY29udGVudFR5cGUsIHJlc291cmNlLnF1ZXJ5KTtcclxuICAgICAgICAgICAgaWYgKHRyYW5zZm9ybWVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gdHJhbnNmb3JtZWQuY29udGVudDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID0gdHJhbnNmb3JtZWQuaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXTtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXSA9IHRyYW5zZm9ybWVkLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXTtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJ4LXRyYW5zZm9ybWVyXCJdID0gdHJhbnNmb3JtZWQuaGVhZGVyc1tcIngtdHJhbnNmb3JtZXJcIl07XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wieC10cmFuc2Zvcm0tZHVyYXRpb25cIl0gPSBgJHtmb3JtYXRIcnRpbWUocHJvY2Vzcy5ocnRpbWUoaHJ0aW1lKSl9c2VjYDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtZWQubGlua3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBhbGwgdGhlIHRyYW5zZm9ybWVycyB0byBtYWtlIHN1cmUgdGhpcyByZXNvbHV0aW9uIGlzIG5vIGxvbmdlciBuZWNlc3NhcnlcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlID0gcG9zaXguZGlybmFtZShyZXNvdXJjZS5wYXRobmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2UubGlua3MgPSB0cmFuc2Zvcm1lZC5saW5rcy5tYXAobGluayA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwb3NpeC5yZXNvbHZlKGJhc2UsIGxpbmspO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZC5pbmNsdWRlZEZpbGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2Uud2F0Y2ggPSB0cmFuc2Zvcm1lZC5pbmNsdWRlZEZpbGVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2Zvcm1lZC5tYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSA9IGB1bmFibGUgdG8gdHJhbnNmb3JtOiAke3Jlc291cmNlLmZpbGVuYW1lfVxcbiR7ZXJyb3IubWVzc2FnZX1gO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZm9ybWF0SHJ0aW1lKGhydGltZTogW251bWJlciwgbnVtYmVyXSkge1xyXG4gICAgICAgIHJldHVybiAoaHJ0aW1lWzBdICsgKGhydGltZVsxXSAvIDFlOSkpLnRvRml4ZWQoMyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzaG91bGRUcmFuc2Zvcm0sXHJcbiAgICAgICAgdHJhbnNmb3JtQ29udGVudFxyXG4gICAgfTtcclxufSk7Il19