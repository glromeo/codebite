"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBabelTransformer = void 0;
const core_1 = require("@babel/core");
const esnext_web_modules_1 = require("esnext-web-modules");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
exports.useBabelTransformer = (0, nano_memoize_1.default)((options, sourceMaps = "auto") => {
    const { resolveImports, rewriteImports } = (0, esnext_web_modules_1.useWebModulesPlugin)(options);
    const preProcess = options.transform && options.transform.preProcess;
    async function babelTransformer(filename, content) {
        const babelOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };
        const source = preProcess ? preProcess(filename, content) : content;
        const parsedAst = (0, core_1.parseSync)(source, babelOptions);
        const importMap = await resolveImports(filename, parsedAst);
        let { code, map, metadata } = (0, core_1.transformFromAstSync)(parsedAst, source, {
            ...babelOptions,
            plugins: [
                ...babelOptions.plugins,
                [rewriteImports, { importMap }]
            ]
        });
        if (!code) {
            throw new Error(`Babel transformer failed to transform: ${filename}`);
        }
        if (map) {
            code += "\n//# sourceMappingURL=" + path_1.default.basename(filename) + ".map\n";
        }
        else {
            code += "\n";
        }
        return {
            content: code,
            headers: {
                "content-type": mime_types_1.JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "babel-transformer"
            },
            map,
            links: [...metadata["imports"]]
        };
    }
    return {
        babelTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSwyREFBdUQ7QUFDdkQsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLHNCQUFRLEVBQUMsQ0FBQyxPQUFzQixFQUFFLGFBQWdDLE1BQU0sRUFBRSxFQUFFO0lBRTNHLE1BQU0sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFDLEdBQUcsSUFBQSx3Q0FBbUIsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUV0RSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO0lBRXJFLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxRQUFlLEVBQUUsT0FBYztRQUUzRCxNQUFNLFlBQVksR0FBcUI7WUFDbkMsR0FBRyxPQUFPLENBQUMsS0FBSztZQUNoQixVQUFVLEVBQUUsVUFBVSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLFFBQVE7WUFDbkcsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsUUFBUTtTQUNyQixDQUFDO1FBRUYsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDcEUsTUFBTSxTQUFTLEdBQUcsSUFBQSxnQkFBUyxFQUFDLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFNUQsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDLEdBQUcsSUFBQSwyQkFBb0IsRUFBQyxTQUFTLEVBQUUsTUFBTSxFQUFFO1lBQ2hFLEdBQUcsWUFBWTtZQUNmLE9BQU8sRUFBRTtnQkFDTCxHQUFHLFlBQVksQ0FBQyxPQUFRO2dCQUN4QixDQUFDLGNBQWMsRUFBRSxFQUFDLFNBQVMsRUFBQyxDQUFDO2FBQ2hDO1NBQ0osQ0FBRSxDQUFDO1FBRUosSUFBSSxDQUFDLElBQUksRUFBRTtZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLEdBQUcsRUFBRTtZQUNMLElBQUksSUFBSSx5QkFBeUIsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQztTQUMxRTthQUFNO1lBQ0gsSUFBSSxJQUFJLElBQUksQ0FBQztTQUNoQjtRQUVELE9BQU87WUFDSCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsb0NBQXVCO2dCQUN2QyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztnQkFDekMsZUFBZSxFQUFFLG1CQUFtQjthQUN2QztZQUNELEdBQUc7WUFDSCxLQUFLLEVBQUUsQ0FBQyxHQUFHLFFBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxnQkFBZ0I7S0FDbkIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwYXJzZVN5bmMsIHRyYW5zZm9ybUZyb21Bc3RTeW5jLCBUcmFuc2Zvcm1PcHRpb25zfSBmcm9tIFwiQGJhYmVsL2NvcmVcIjtcclxuaW1wb3J0IHt1c2VXZWJNb2R1bGVzUGx1Z2lufSBmcm9tIFwiZXNuZXh0LXdlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge0pBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcbmltcG9ydCB7VHJhbnNmb3JtZXJPdXRwdXR9IGZyb20gXCIuL2luZGV4XCI7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlQmFiZWxUcmFuc2Zvcm1lciA9IG1lbW9pemVkKChvcHRpb25zOiBFU05leHRPcHRpb25zLCBzb3VyY2VNYXBzOiBcImlubGluZVwiIHwgXCJhdXRvXCIgPSBcImF1dG9cIikgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0cywgcmV3cml0ZUltcG9ydHN9ID0gdXNlV2ViTW9kdWxlc1BsdWdpbihvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCBwcmVQcm9jZXNzID0gb3B0aW9ucy50cmFuc2Zvcm0gJiYgb3B0aW9ucy50cmFuc2Zvcm0ucHJlUHJvY2VzcztcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBiYWJlbFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGJhYmVsT3B0aW9uczogVHJhbnNmb3JtT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgLi4ub3B0aW9ucy5iYWJlbCxcclxuICAgICAgICAgICAgc291cmNlTWFwczogc291cmNlTWFwcyA9PT0gXCJhdXRvXCIgPyBvcHRpb25zLmJhYmVsLnNvdXJjZU1hcHMgOiBvcHRpb25zLmJhYmVsLnNvdXJjZU1hcHMgJiYgXCJpbmxpbmVcIixcclxuICAgICAgICAgICAgYmFiZWxyYzogdHJ1ZSxcclxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3Qgc291cmNlID0gcHJlUHJvY2VzcyA/IHByZVByb2Nlc3MoZmlsZW5hbWUsIGNvbnRlbnQpIDogY29udGVudDtcclxuICAgICAgICBjb25zdCBwYXJzZWRBc3QgPSBwYXJzZVN5bmMoc291cmNlLCBiYWJlbE9wdGlvbnMpITtcclxuICAgICAgICBjb25zdCBpbXBvcnRNYXAgPSBhd2FpdCByZXNvbHZlSW1wb3J0cyhmaWxlbmFtZSwgcGFyc2VkQXN0KTtcclxuXHJcbiAgICAgICAgbGV0IHtjb2RlLCBtYXAsIG1ldGFkYXRhfSA9IHRyYW5zZm9ybUZyb21Bc3RTeW5jKHBhcnNlZEFzdCwgc291cmNlLCB7XHJcbiAgICAgICAgICAgIC4uLmJhYmVsT3B0aW9ucyxcclxuICAgICAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgICAgICAgLi4uYmFiZWxPcHRpb25zLnBsdWdpbnMhLFxyXG4gICAgICAgICAgICAgICAgW3Jld3JpdGVJbXBvcnRzLCB7aW1wb3J0TWFwfV1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pITtcclxuXHJcbiAgICAgICAgaWYgKCFjb2RlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFiZWwgdHJhbnNmb3JtZXIgZmFpbGVkIHRvIHRyYW5zZm9ybTogJHtmaWxlbmFtZX1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtYXApIHtcclxuICAgICAgICAgICAgY29kZSArPSBcIlxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVwiICsgcGF0aC5iYXNlbmFtZShmaWxlbmFtZSkgKyBcIi5tYXBcXG5cIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb2RlICs9IFwiXFxuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBjb2RlLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoY29kZSksXHJcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJiYWJlbC10cmFuc2Zvcm1lclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1hcCxcclxuICAgICAgICAgICAgbGlua3M6IFsuLi5tZXRhZGF0YSFbXCJpbXBvcnRzXCJdXVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBiYWJlbFRyYW5zZm9ybWVyXHJcbiAgICB9O1xyXG59KTtcclxuIl19