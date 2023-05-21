"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHttp2Push = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = __importDefault(require("http2"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const resource_provider_1 = require("../providers/resource-provider");
exports.useHttp2Push = (0, nano_memoize_1.default)((options) => {
    const { provideResource } = (0, resource_provider_1.useResourceProvider)(options);
    const { HTTP2_HEADER_PATH, NGHTTP2_REFUSED_STREAM } = http2_1.default.constants;
    function http2Push(stream, pathname, urls) {
        for (const url of urls) {
            provideResource(url).then(resource => {
                if (stream.destroyed) {
                    return;
                }
                if (!stream.pushAllowed) {
                    tiny_node_logger_1.default.debug("not allowed pushing from:", pathname);
                    return;
                }
                stream.pushStream({ [HTTP2_HEADER_PATH]: url }, function (err, push) {
                    if (err) {
                        tiny_node_logger_1.default.warn("cannot push stream for:", url, "from:", pathname, err);
                        return;
                    }
                    push.on("error", function (err) {
                        if (push.rstCode === NGHTTP2_REFUSED_STREAM) {
                            tiny_node_logger_1.default.debug("NGHTTP2_REFUSED_STREAM", url);
                        }
                        else if (err.code === "ERR_HTTP2_STREAM_ERROR") {
                            tiny_node_logger_1.default.warn("ERR_HTTP2_STREAM_ERROR", url);
                        }
                        else {
                            tiny_node_logger_1.default.error(err.code, url, err.message);
                        }
                    });
                    if (!push.destroyed) {
                        push.respond({
                            ...resource.headers,
                            ":status": http_status_codes_1.default.OK
                        });
                        push.end(resource.content);
                    }
                });
            }).catch(err => {
                tiny_node_logger_1.default.warn("error pushing:", url, "from:", pathname, err);
            });
        }
    }
    return {
        http2Push
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cDItcHVzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2h0dHAyLXB1c2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsMEVBQTJDO0FBQzNDLGtEQUErQztBQUMvQyxnRUFBb0M7QUFDcEMsd0VBQW1DO0FBRW5DLHNFQUFtRTtBQUV0RCxRQUFBLFlBQVksR0FBRyxJQUFBLHNCQUFRLEVBQUMsQ0FBQyxPQUFzQixFQUFFLEVBQUU7SUFFNUQsTUFBTSxFQUFDLGVBQWUsRUFBQyxHQUFHLElBQUEsdUNBQW1CLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFFdkQsTUFBTSxFQUNGLGlCQUFpQixFQUNqQixzQkFBc0IsRUFDekIsR0FBRyxlQUFLLENBQUMsU0FBUyxDQUFDO0lBRXBCLFNBQVMsU0FBUyxDQUFDLE1BQXlCLEVBQUUsUUFBUSxFQUFFLElBQXVCO1FBQzNFLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3BCLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRTtvQkFDbEIsT0FBTztpQkFDVjtnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtvQkFDckIsMEJBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2pELE9BQU87aUJBQ1Y7Z0JBQ0QsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFDLENBQUMsaUJBQWlCLENBQUMsRUFBRSxHQUFHLEVBQUMsRUFBRSxVQUFVLEdBQUcsRUFBRSxJQUFJO29CQUU3RCxJQUFJLEdBQUcsRUFBRTt3QkFDTCwwQkFBRyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDakUsT0FBTztxQkFDVjtvQkFFRCxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLEdBQVE7d0JBQy9CLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxzQkFBc0IsRUFBRTs0QkFDekMsMEJBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUM7eUJBQzVDOzZCQUFNLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyx3QkFBd0IsRUFBRTs0QkFDOUMsMEJBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUM7eUJBQzNDOzZCQUFNOzRCQUNILDBCQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFDekM7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7b0JBRUgsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7d0JBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUM7NEJBQ1QsR0FBRyxRQUFRLENBQUMsT0FBTzs0QkFDbkIsU0FBUyxFQUFFLDJCQUFVLENBQUMsRUFBRTt5QkFDM0IsQ0FBQyxDQUFDO3dCQUNILElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3FCQUM5QjtnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDWCwwQkFBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1RCxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxTQUFTO0tBQ1osQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGU1dhdGNoZXJ9IGZyb20gXCJjaG9raWRhclwiO1xyXG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcclxuaW1wb3J0IGh0dHAyLCB7U2VydmVySHR0cDJTdHJlYW19IGZyb20gXCJodHRwMlwiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3VzZVJlc291cmNlUHJvdmlkZXJ9IGZyb20gXCIuLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VIdHRwMlB1c2ggPSBtZW1vaXplZCgob3B0aW9uczogRVNOZXh0T3B0aW9ucykgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgSFRUUDJfSEVBREVSX1BBVEgsXHJcbiAgICAgICAgTkdIVFRQMl9SRUZVU0VEX1NUUkVBTVxyXG4gICAgfSA9IGh0dHAyLmNvbnN0YW50cztcclxuXHJcbiAgICBmdW5jdGlvbiBodHRwMlB1c2goc3RyZWFtOiBTZXJ2ZXJIdHRwMlN0cmVhbSwgcGF0aG5hbWUsIHVybHM6IHJlYWRvbmx5IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xyXG4gICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UodXJsKS50aGVuKHJlc291cmNlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uZGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFzdHJlYW0ucHVzaEFsbG93ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJub3QgYWxsb3dlZCBwdXNoaW5nIGZyb206XCIsIHBhdGhuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaFN0cmVhbSh7W0hUVFAyX0hFQURFUl9QQVRIXTogdXJsfSwgZnVuY3Rpb24gKGVyciwgcHVzaCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiY2Fubm90IHB1c2ggc3RyZWFtIGZvcjpcIiwgdXJsLCBcImZyb206XCIsIHBhdGhuYW1lLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBwdXNoLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwdXNoLnJzdENvZGUgPT09IE5HSFRUUDJfUkVGVVNFRF9TVFJFQU0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIk5HSFRUUDJfUkVGVVNFRF9TVFJFQU1cIiwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIuY29kZSA9PT0gXCJFUlJfSFRUUDJfU1RSRUFNX0VSUk9SXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiRVJSX0hUVFAyX1NUUkVBTV9FUlJPUlwiLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yKGVyci5jb2RlLCB1cmwsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXB1c2guZGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2gucmVzcG9uZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5yZXNvdXJjZS5oZWFkZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI6c3RhdHVzXCI6IEh0dHBTdGF0dXMuT0tcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2guZW5kKHJlc291cmNlLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9nLndhcm4oXCJlcnJvciBwdXNoaW5nOlwiLCB1cmwsIFwiZnJvbTpcIiwgcGF0aG5hbWUsIGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGh0dHAyUHVzaFxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==