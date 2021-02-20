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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3psaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTZCO0FBQzdCLGdFQUFtQztBQUd0QixRQUFBLE9BQU8sR0FBRyxzQkFBTyxDQUFDLENBQUMsT0FBcUIsRUFBQyxFQUFFO0lBRXBELFNBQVMsaUJBQWlCLENBQUMsUUFBMEU7UUFDakcsSUFBSSxRQUFRLEtBQUssU0FBUztZQUFFLE9BQU8sSUFBSSxtQkFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2pELElBQUksUUFBUSxLQUFLLE1BQU07WUFBRSxPQUFPLElBQUksbUJBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJO1lBQUUsT0FBTyxJQUFJLG1CQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBd0IsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7UUFDM0UsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsSUFBSTtZQUNBLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQztnQkFBUztZQUNOLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNwQjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsZ0JBQWdCO0tBQ25CLENBQUE7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6bGliIGZyb20gXCJmYXN0LXpsaWJcIjtcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuXG5leHBvcnQgY29uc3QgdXNlWmxpYiA9IG1lbW9pemUoKG9wdGlvbnM6RVNOZXh0T3B0aW9ucyk9PntcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbXByZXNzaW9uKGVuY29kaW5nOiBcImd6aXBcIiB8IFwiYnJvdGxpXCIgfCBcImJyXCIgfCBcImRlZmxhdGVcIiB8IFwiZGVmbGF0ZS1yYXdcIiB8IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoZW5jb2RpbmcgPT09IFwiZGVmbGF0ZVwiKSByZXR1cm4gbmV3IHpsaWIuRGVmbGF0ZSgpO1xuICAgICAgICBlbHNlIGlmIChlbmNvZGluZyA9PT0gXCJnemlwXCIpIHJldHVybiBuZXcgemxpYi5HemlwKCk7XG4gICAgICAgIGVsc2UgaWYgKGVuY29kaW5nID09PSBcImJyXCIpIHJldHVybiBuZXcgemxpYi5Ccm90bGlDb21wcmVzcygpO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihgZW5jb2RpbmcgJyR7ZW5jb2Rpbmd9JyBub3Qgc3VwcG9ydGVkLmApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5Q29tcHJlc3Npb24oY29udGVudDogc3RyaW5nIHwgQnVmZmVyLCBlbmNvZGluZyA9IG9wdGlvbnMuZW5jb2RpbmcpIHtcbiAgICAgICAgbGV0IGNvbXByZXNzID0gY3JlYXRlQ29tcHJlc3Npb24oZW5jb2RpbmcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXByZXNzLnByb2Nlc3MoY29udGVudCk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBjb21wcmVzcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXBwbHlDb21wcmVzc2lvblxuICAgIH1cbn0pOyJdfQ==