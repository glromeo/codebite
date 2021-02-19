"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZlib = void 0;
const fast_zlib_1 = __importDefault(require("fast-zlib"));
const pico_memoize_1 = __importDefault(require("pico-memoize"));
exports.useZlib = pico_memoize_1.default((options) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFtQztBQUd0QixRQUFBLE9BQU8sR0FBRyxzQkFBTyxDQUFDLENBQUMsT0FBcUIsRUFBQyxFQUFFO0lBRXBELFNBQVMsaUJBQWlCLENBQUMsUUFBMEU7UUFDakcsSUFBSSxRQUFRLEtBQUssU0FBUztZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELElBQUksUUFBUSxLQUFLLE1BQU07WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7UUFDM0UsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsSUFBSTtZQUNBLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQztnQkFBUztZQUNOLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6bGliIGZyb20gXCJmYXN0LXpsaWJcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VabGliID0gbWVtb2l6ZSgob3B0aW9uczpFU05leHRPcHRpb25zKT0+e1xyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbXByZXNzaW9uKGVuY29kaW5nOiBcImd6aXBcIiB8IFwiYnJvdGxpXCIgfCBcImJyXCIgfCBcImRlZmxhdGVcIiB8IFwiZGVmbGF0ZS1yYXdcIiB8IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChlbmNvZGluZyA9PT0gXCJkZWZsYXRlXCIpIHJldHVybiBuZXcgemxpYi5EZWZsYXRlKCk7XHJcbiAgICAgICAgZWxzZSBpZiAoZW5jb2RpbmcgPT09IFwiZ3ppcFwiKSByZXR1cm4gbmV3IHpsaWIuR3ppcCgpO1xyXG4gICAgICAgIGVsc2UgaWYgKGVuY29kaW5nID09PSBcImJyXCIpIHJldHVybiBuZXcgemxpYi5Ccm90bGlDb21wcmVzcygpO1xyXG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGBlbmNvZGluZyAnJHtlbmNvZGluZ30nIG5vdCBzdXBwb3J0ZWQuYCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDb21wcmVzc2lvbihjb250ZW50OiBzdHJpbmcgfCBCdWZmZXIsIGVuY29kaW5nID0gb3B0aW9ucy5lbmNvZGluZykge1xyXG4gICAgICAgIGxldCBjb21wcmVzcyA9IGNyZWF0ZUNvbXByZXNzaW9uKGVuY29kaW5nKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcHJlc3MucHJvY2Vzcyhjb250ZW50KTtcclxuICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICBjb21wcmVzcy5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGFwcGx5Q29tcHJlc3Npb25cclxuICAgIH1cclxufSk7Il19