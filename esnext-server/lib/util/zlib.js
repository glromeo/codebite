"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZlib = void 0;
const fast_zlib_1 = __importDefault(require("fast-zlib"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
exports.useZlib = (0, nano_memoize_1.default)((options) => {
    function createCompression(encoding) {
        if (encoding === "deflate")
            return new fast_zlib_1.default.Deflate();
        else if (encoding === "gzip")
            return new fast_zlib_1.default.Gzip();
        else if (encoding === "br")
            return new fast_zlib_1.default.BrotliCompress();
        else
            throw new Error(`encoding '${encoding}' not supported.`);
    }
    function applyCompression(content, encoding = options.encoding) {
        let compress = createCompression(encoding);
        try {
            return compress.process(content);
        }
        finally {
            compress.close();
        }
    }
    return {
        applyCompression
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFvQztBQUd2QixRQUFBLE9BQU8sR0FBRyxJQUFBLHNCQUFRLEVBQUMsQ0FBQyxPQUFxQixFQUFDLEVBQUU7SUFFckQsU0FBUyxpQkFBaUIsQ0FBQyxRQUEwRTtRQUNqRyxJQUFJLFFBQVEsS0FBSyxTQUFTO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDakQsSUFBSSxRQUFRLEtBQUssTUFBTTtZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ2hELElBQUksUUFBUSxLQUFLLElBQUk7WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7WUFDeEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxhQUFhLFFBQVEsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUF3QixFQUFFLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUTtRQUMzRSxJQUFJLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQyxJQUFJO1lBQ0EsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3BDO2dCQUFTO1lBQ04sUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3BCO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxnQkFBZ0I7S0FDbkIsQ0FBQTtBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHpsaWIgZnJvbSBcImZhc3QtemxpYlwiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VabGliID0gbWVtb2l6ZWQoKG9wdGlvbnM6RVNOZXh0T3B0aW9ucyk9PntcclxuXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVDb21wcmVzc2lvbihlbmNvZGluZzogXCJnemlwXCIgfCBcImJyb3RsaVwiIHwgXCJiclwiIHwgXCJkZWZsYXRlXCIgfCBcImRlZmxhdGUtcmF3XCIgfCB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoZW5jb2RpbmcgPT09IFwiZGVmbGF0ZVwiKSByZXR1cm4gbmV3IHpsaWIuRGVmbGF0ZSgpO1xyXG4gICAgICAgIGVsc2UgaWYgKGVuY29kaW5nID09PSBcImd6aXBcIikgcmV0dXJuIG5ldyB6bGliLkd6aXAoKTtcclxuICAgICAgICBlbHNlIGlmIChlbmNvZGluZyA9PT0gXCJiclwiKSByZXR1cm4gbmV3IHpsaWIuQnJvdGxpQ29tcHJlc3MoKTtcclxuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihgZW5jb2RpbmcgJyR7ZW5jb2Rpbmd9JyBub3Qgc3VwcG9ydGVkLmApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGx5Q29tcHJlc3Npb24oY29udGVudDogc3RyaW5nIHwgQnVmZmVyLCBlbmNvZGluZyA9IG9wdGlvbnMuZW5jb2RpbmcpIHtcclxuICAgICAgICBsZXQgY29tcHJlc3MgPSBjcmVhdGVDb21wcmVzc2lvbihlbmNvZGluZyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXByZXNzLnByb2Nlc3MoY29udGVudCk7XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgY29tcHJlc3MuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBhcHBseUNvbXByZXNzaW9uXHJcbiAgICB9XHJcbn0pOyJdfQ==