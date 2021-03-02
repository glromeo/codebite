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
exports.useBabelTransformer = nano_memoize_1.default((options, sourceMaps = "auto") => {
    const { resolveImports, rewriteImports } = esnext_web_modules_1.useWebModulesPlugin(options);
    const preProcess = options.transform && options.transform.preProcess;
    async function babelTransformer(filename, content) {
        const babelOptions = {
            ...options.babel,
            sourceMaps: sourceMaps === "auto" ? options.babel.sourceMaps : options.babel.sourceMaps && "inline",
            babelrc: true,
            filename: filename
        };
        const source = preProcess ? preProcess(filename, content) : content;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFiZWwtdHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNmb3JtZXJzL2JhYmVsLXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHNDQUE4RTtBQUM5RSwyREFBdUQ7QUFDdkQsZ0VBQW9DO0FBQ3BDLGdEQUF3QjtBQUV4QixtREFBMkQ7QUFHOUMsUUFBQSxtQkFBbUIsR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBc0IsRUFBRSxhQUFnQyxNQUFNLEVBQUUsRUFBRTtJQUUzRyxNQUFNLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBQyxHQUFHLHdDQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXRFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFFckUsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQWUsRUFBRSxPQUFjO1FBRTNELE1BQU0sWUFBWSxHQUFxQjtZQUNuQyxHQUFHLE9BQU8sQ0FBQyxLQUFLO1lBQ2hCLFVBQVUsRUFBRSxVQUFVLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksUUFBUTtZQUNuRyxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNwRSxNQUFNLFNBQVMsR0FBRyxnQkFBUyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFNUQsSUFBSSxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDLEdBQUcsMkJBQW9CLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRTtZQUNoRSxHQUFHLFlBQVk7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsR0FBRyxZQUFZLENBQUMsT0FBUTtnQkFDeEIsQ0FBQyxjQUFjLEVBQUUsRUFBQyxTQUFTLEVBQUMsQ0FBQzthQUNoQztTQUNKLENBQUUsQ0FBQztRQUVKLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsSUFBSSxHQUFHLEVBQUU7WUFDTCxJQUFJLElBQUkseUJBQXlCLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDMUU7YUFBTTtZQUNILElBQUksSUFBSSxJQUFJLENBQUM7U0FDaEI7UUFFRCxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLG9DQUF1QjtnQkFDdkMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxtQkFBbUI7YUFDdkM7WUFDRCxHQUFHO1lBQ0gsS0FBSyxFQUFFLENBQUMsR0FBRyxRQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkMsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cGFyc2VTeW5jLCB0cmFuc2Zvcm1Gcm9tQXN0U3luYywgVHJhbnNmb3JtT3B0aW9uc30gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XG5pbXBvcnQge3VzZVdlYk1vZHVsZXNQbHVnaW59IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5pbXBvcnQge0pBVkFTQ1JJUFRfQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgY29uc3QgdXNlQmFiZWxUcmFuc2Zvcm1lciA9IG1lbW9pemVkKChvcHRpb25zOiBFU05leHRPcHRpb25zLCBzb3VyY2VNYXBzOiBcImlubGluZVwiIHwgXCJhdXRvXCIgPSBcImF1dG9cIikgPT4ge1xuXG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnRzLCByZXdyaXRlSW1wb3J0c30gPSB1c2VXZWJNb2R1bGVzUGx1Z2luKG9wdGlvbnMpO1xuXG4gICAgY29uc3QgcHJlUHJvY2VzcyA9IG9wdGlvbnMudHJhbnNmb3JtICYmIG9wdGlvbnMudHJhbnNmb3JtLnByZVByb2Nlc3M7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBiYWJlbFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XG5cbiAgICAgICAgY29uc3QgYmFiZWxPcHRpb25zOiBUcmFuc2Zvcm1PcHRpb25zID0ge1xuICAgICAgICAgICAgLi4ub3B0aW9ucy5iYWJlbCxcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHNvdXJjZU1hcHMgPT09IFwiYXV0b1wiID8gb3B0aW9ucy5iYWJlbC5zb3VyY2VNYXBzIDogb3B0aW9ucy5iYWJlbC5zb3VyY2VNYXBzICYmIFwiaW5saW5lXCIsXG4gICAgICAgICAgICBiYWJlbHJjOiB0cnVlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgc291cmNlID0gcHJlUHJvY2VzcyA/IHByZVByb2Nlc3MoZmlsZW5hbWUsIGNvbnRlbnQpIDogY29udGVudDtcbiAgICAgICAgY29uc3QgcGFyc2VkQXN0ID0gcGFyc2VTeW5jKHNvdXJjZSwgYmFiZWxPcHRpb25zKSE7XG4gICAgICAgIGNvbnN0IGltcG9ydE1hcCA9IGF3YWl0IHJlc29sdmVJbXBvcnRzKGZpbGVuYW1lLCBwYXJzZWRBc3QpO1xuXG4gICAgICAgIGxldCB7Y29kZSwgbWFwLCBtZXRhZGF0YX0gPSB0cmFuc2Zvcm1Gcm9tQXN0U3luYyhwYXJzZWRBc3QsIHNvdXJjZSwge1xuICAgICAgICAgICAgLi4uYmFiZWxPcHRpb25zLFxuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgIC4uLmJhYmVsT3B0aW9ucy5wbHVnaW5zISxcbiAgICAgICAgICAgICAgICBbcmV3cml0ZUltcG9ydHMsIHtpbXBvcnRNYXB9XVxuICAgICAgICAgICAgXVxuICAgICAgICB9KSE7XG5cbiAgICAgICAgaWYgKCFjb2RlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhYmVsIHRyYW5zZm9ybWVyIGZhaWxlZCB0byB0cmFuc2Zvcm06ICR7ZmlsZW5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWFwKSB7XG4gICAgICAgICAgICBjb2RlICs9IFwiXFxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9XCIgKyBwYXRoLmJhc2VuYW1lKGZpbGVuYW1lKSArIFwiLm1hcFxcblwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZSArPSBcIlxcblwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvZGUsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSkFWQVNDUklQVF9DT05URU5UX1RZUEUsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChjb2RlKSxcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJiYWJlbC10cmFuc2Zvcm1lclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWFwLFxuICAgICAgICAgICAgbGlua3M6IFsuLi5tZXRhZGF0YSFbXCJpbXBvcnRzXCJdXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGJhYmVsVHJhbnNmb3JtZXJcbiAgICB9O1xufSk7XG4iXX0=