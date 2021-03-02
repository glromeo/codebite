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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFvQztBQUd2QixRQUFBLE9BQU8sR0FBRyxzQkFBUSxDQUFDLENBQUMsT0FBcUIsRUFBQyxFQUFFO0lBRXJELFNBQVMsaUJBQWlCLENBQUMsUUFBMEU7UUFDakcsSUFBSSxRQUFRLEtBQUssU0FBUztZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELElBQUksUUFBUSxLQUFLLE1BQU07WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7UUFDM0UsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsSUFBSTtZQUNBLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQztnQkFBUztZQUNOLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6bGliIGZyb20gXCJmYXN0LXpsaWJcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcblxuZXhwb3J0IGNvbnN0IHVzZVpsaWIgPSBtZW1vaXplZCgob3B0aW9uczpFU05leHRPcHRpb25zKT0+e1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29tcHJlc3Npb24oZW5jb2Rpbmc6IFwiZ3ppcFwiIHwgXCJicm90bGlcIiB8IFwiYnJcIiB8IFwiZGVmbGF0ZVwiIHwgXCJkZWZsYXRlLXJhd1wiIHwgdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChlbmNvZGluZyA9PT0gXCJkZWZsYXRlXCIpIHJldHVybiBuZXcgemxpYi5EZWZsYXRlKCk7XG4gICAgICAgIGVsc2UgaWYgKGVuY29kaW5nID09PSBcImd6aXBcIikgcmV0dXJuIG5ldyB6bGliLkd6aXAoKTtcbiAgICAgICAgZWxzZSBpZiAoZW5jb2RpbmcgPT09IFwiYnJcIikgcmV0dXJuIG5ldyB6bGliLkJyb3RsaUNvbXByZXNzKCk7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGBlbmNvZGluZyAnJHtlbmNvZGluZ30nIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwbHlDb21wcmVzc2lvbihjb250ZW50OiBzdHJpbmcgfCBCdWZmZXIsIGVuY29kaW5nID0gb3B0aW9ucy5lbmNvZGluZykge1xuICAgICAgICBsZXQgY29tcHJlc3MgPSBjcmVhdGVDb21wcmVzc2lvbihlbmNvZGluZyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHJlc3MucHJvY2Vzcyhjb250ZW50KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGNvbXByZXNzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhcHBseUNvbXByZXNzaW9uXG4gICAgfVxufSk7Il19