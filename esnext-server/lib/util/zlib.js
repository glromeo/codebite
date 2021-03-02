"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZlib = void 0;
const fast_zlib_1 = __importDefault(require("fast-zlib"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
exports.useZlib = nano_memoize_1.default((options) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFvQztBQUd2QixRQUFBLE9BQU8sR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBcUIsRUFBQyxFQUFFO0lBRXJELFNBQVMsaUJBQWlCLENBQUMsUUFBMEU7UUFDakcsSUFBSSxRQUFRLEtBQUssU0FBUztZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELElBQUksUUFBUSxLQUFLLE1BQU07WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7UUFDM0UsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsSUFBSTtZQUNBLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQztnQkFBUztZQUNOLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6bGliIGZyb20gXCJmYXN0LXpsaWJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlWmxpYiA9IG1lbW9pemVkKChvcHRpb25zOkVTTmV4dE9wdGlvbnMpPT57XHJcblxyXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29tcHJlc3Npb24oZW5jb2Rpbmc6IFwiZ3ppcFwiIHwgXCJicm90bGlcIiB8IFwiYnJcIiB8IFwiZGVmbGF0ZVwiIHwgXCJkZWZsYXRlLXJhd1wiIHwgdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKGVuY29kaW5nID09PSBcImRlZmxhdGVcIikgcmV0dXJuIG5ldyB6bGliLkRlZmxhdGUoKTtcclxuICAgICAgICBlbHNlIGlmIChlbmNvZGluZyA9PT0gXCJnemlwXCIpIHJldHVybiBuZXcgemxpYi5HemlwKCk7XHJcbiAgICAgICAgZWxzZSBpZiAoZW5jb2RpbmcgPT09IFwiYnJcIikgcmV0dXJuIG5ldyB6bGliLkJyb3RsaUNvbXByZXNzKCk7XHJcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYGVuY29kaW5nICcke2VuY29kaW5nfScgbm90IHN1cHBvcnRlZC5gKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseUNvbXByZXNzaW9uKGNvbnRlbnQ6IHN0cmluZyB8IEJ1ZmZlciwgZW5jb2RpbmcgPSBvcHRpb25zLmVuY29kaW5nKSB7XHJcbiAgICAgICAgbGV0IGNvbXByZXNzID0gY3JlYXRlQ29tcHJlc3Npb24oZW5jb2RpbmcpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wcmVzcy5wcm9jZXNzKGNvbnRlbnQpO1xyXG4gICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgIGNvbXByZXNzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYXBwbHlDb21wcmVzc2lvblxyXG4gICAgfVxyXG59KTsiXX0=