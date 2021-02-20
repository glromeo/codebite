"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBabelTransformer = void 0;
const core_1 = require("@babel/core");
const esnext_web_modules_1 = require("esnext-web-modules");
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = require("../util/mime-types");
exports.useBabelTransformer = pico_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImports, rewriteImports } = esnext_web_modules_1.useWebModulesPlugin(options);
    async function babelTransformer(filename, content) {
        const babelOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };
        const source = content;
        const parsedAst = core_1.parseSync(source, babelOptions);
        const importMap = await resolveImports(filename, parsedAst);
        let { code, map, metadata } = core_1.transformFromAstSync(parsedAst, source, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSwyREFBdUQ7QUFDdkQsZ0VBQW1DO0FBQ25DLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxzQkFBTyxDQUFDLENBQUMsT0FBc0IsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUUxRyxNQUFNLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxHQUFHLHdDQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxRQUFlLEVBQUUsT0FBYztRQUUzRCxNQUFNLFlBQVksR0FBcUI7WUFDbkMsR0FBRyxPQUFPLENBQUMsS0FBSztZQUNoQixVQUFVLEVBQUUsVUFBVSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLFFBQVE7WUFDbkcsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsUUFBUTtTQUNyQixDQUFDO1FBRUYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLGdCQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ25ELE1BQU0sU0FBUyxHQUFHLE1BQU0sY0FBYyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUU1RCxJQUFJLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUMsR0FBRywyQkFBb0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFO1lBQ2hFLEdBQUcsWUFBWTtZQUNmLE9BQU8sRUFBRTtnQkFDTCxHQUFHLFlBQVksQ0FBQyxPQUFRO2dCQUN4QixDQUFDLGNBQWMsRUFBRSxFQUFDLFNBQVMsRUFBQyxDQUFDO2FBQ2hDO1NBQ0osQ0FBRSxDQUFDO1FBRUosSUFBSSxDQUFDLElBQUksRUFBRTtZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLEdBQUcsRUFBRTtZQUNMLElBQUksSUFBSSx5QkFBeUIsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQztTQUMxRTthQUFNO1lBQ0gsSUFBSSxJQUFJLElBQUksQ0FBQztTQUNoQjtRQUVELE9BQU87WUFDSCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsb0NBQXVCO2dCQUN2QyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztnQkFDekMsZUFBZSxFQUFFLG1CQUFtQjthQUN2QztZQUNELEdBQUc7WUFDSCxLQUFLLEVBQUUsQ0FBQyxHQUFHLFFBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxnQkFBZ0I7S0FDbkIsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwYXJzZVN5bmMsIHRyYW5zZm9ybUZyb21Bc3RTeW5jLCBUcmFuc2Zvcm1PcHRpb25zfSBmcm9tIFwiQGJhYmVsL2NvcmVcIjtcbmltcG9ydCB7dXNlV2ViTW9kdWxlc1BsdWdpbn0gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtKQVZBU0NSSVBUX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcblxuZXhwb3J0IGNvbnN0IHVzZUJhYmVsVHJhbnNmb3JtZXIgPSBtZW1vaXplKChvcHRpb25zOiBFU05leHRPcHRpb25zLCBzb3VyY2VNYXBzOiBcImlubGluZVwiIHwgXCJhdXRvXCIgPSBcImF1dG9cIikgPT4ge1xuXG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnRzLCByZXdyaXRlSW1wb3J0c30gPSB1c2VXZWJNb2R1bGVzUGx1Z2luKG9wdGlvbnMpO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gYmFiZWxUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xuXG4gICAgICAgIGNvbnN0IGJhYmVsT3B0aW9uczogVHJhbnNmb3JtT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuYmFiZWwsXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiBzb3VyY2VNYXBzID09PSBcImF1dG9cIiA/IG9wdGlvbnMuYmFiZWwuc291cmNlTWFwcyA6IG9wdGlvbnMuYmFiZWwuc291cmNlTWFwcyAmJiBcImlubGluZVwiLFxuICAgICAgICAgICAgYmFiZWxyYzogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IHBhcnNlZEFzdCA9IHBhcnNlU3luYyhzb3VyY2UsIGJhYmVsT3B0aW9ucykhO1xuICAgICAgICBjb25zdCBpbXBvcnRNYXAgPSBhd2FpdCByZXNvbHZlSW1wb3J0cyhmaWxlbmFtZSwgcGFyc2VkQXN0KTtcblxuICAgICAgICBsZXQge2NvZGUsIG1hcCwgbWV0YWRhdGF9ID0gdHJhbnNmb3JtRnJvbUFzdFN5bmMocGFyc2VkQXN0LCBzb3VyY2UsIHtcbiAgICAgICAgICAgIC4uLmJhYmVsT3B0aW9ucyxcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAgICAgICAuLi5iYWJlbE9wdGlvbnMucGx1Z2lucyEsXG4gICAgICAgICAgICAgICAgW3Jld3JpdGVJbXBvcnRzLCB7aW1wb3J0TWFwfV1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSkhO1xuXG4gICAgICAgIGlmICghY29kZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYWJlbCB0cmFuc2Zvcm1lciBmYWlsZWQgdG8gdHJhbnNmb3JtOiAke2ZpbGVuYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hcCkge1xuICAgICAgICAgICAgY29kZSArPSBcIlxcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVwiICsgcGF0aC5iYXNlbmFtZShmaWxlbmFtZSkgKyBcIi5tYXBcXG5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUgKz0gXCJcXG5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50OiBjb2RlLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoY29kZSksXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiYmFiZWwtdHJhbnNmb3JtZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1hcCxcbiAgICAgICAgICAgIGxpbmtzOiBbLi4ubWV0YWRhdGEhW1wiaW1wb3J0c1wiXV1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBiYWJlbFRyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19