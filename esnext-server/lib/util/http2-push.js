"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHttp2Push = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = __importDefault(require("http2"));
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const resource_provider_1 = require("../providers/resource-provider");
exports.useHttp2Push = pico_memoize_1.default((options, watcher) => {
    const { provideResource } = resource_provider_1.useResourceProvider(options, watcher);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cDItcHVzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2h0dHAyLXB1c2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsMEVBQTJDO0FBQzNDLGtEQUErQztBQUMvQyxnRUFBbUM7QUFDbkMsd0VBQW1DO0FBRW5DLHNFQUFtRTtBQUV0RCxRQUFBLFlBQVksR0FBRyxzQkFBTyxDQUFDLENBQUMsT0FBc0IsRUFBRSxPQUFrQixFQUFFLEVBQUU7SUFFL0UsTUFBTSxFQUFDLGVBQWUsRUFBQyxHQUFHLHVDQUFtQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVoRSxNQUFNLEVBQ0YsaUJBQWlCLEVBQ2pCLHNCQUFzQixFQUN6QixHQUFHLGVBQUssQ0FBQyxTQUFTLENBQUM7SUFFcEIsU0FBUyxTQUFTLENBQUMsTUFBeUIsRUFBRSxRQUFRLEVBQUUsSUFBdUI7UUFDM0UsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDcEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFO29CQUNsQixPQUFPO2lCQUNWO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO29CQUNyQiwwQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakQsT0FBTztpQkFDVjtnQkFDRCxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBQyxFQUFFLFVBQVUsR0FBRyxFQUFFLElBQUk7b0JBRTdELElBQUksR0FBRyxFQUFFO3dCQUNMLDBCQUFHLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUNqRSxPQUFPO3FCQUNWO29CQUVELElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsR0FBUTt3QkFDL0IsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLHNCQUFzQixFQUFFOzRCQUN6QywwQkFBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDNUM7NkJBQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLHdCQUF3QixFQUFFOzRCQUM5QywwQkFBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzt5QkFDM0M7NkJBQU07NEJBQ0gsMEJBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3lCQUN6QztvQkFDTCxDQUFDLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTt3QkFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQzs0QkFDVCxHQUFHLFFBQVEsQ0FBQyxPQUFPOzRCQUNuQixTQUFTLEVBQUUsMkJBQVUsQ0FBQyxFQUFFO3lCQUMzQixDQUFDLENBQUM7d0JBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQzlCO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLDBCQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUQsT0FBTztRQUNILFNBQVM7S0FDWixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcbmltcG9ydCBodHRwMiwge1NlcnZlckh0dHAyU3RyZWFtfSBmcm9tIFwiaHR0cDJcIjtcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XG5cbmV4cG9ydCBjb25zdCB1c2VIdHRwMlB1c2ggPSBtZW1vaXplKChvcHRpb25zOiBFU05leHRPcHRpb25zLCB3YXRjaGVyOiBGU1dhdGNoZXIpID0+IHtcblxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zLCB3YXRjaGVyKTtcblxuICAgIGNvbnN0IHtcbiAgICAgICAgSFRUUDJfSEVBREVSX1BBVEgsXG4gICAgICAgIE5HSFRUUDJfUkVGVVNFRF9TVFJFQU1cbiAgICB9ID0gaHR0cDIuY29uc3RhbnRzO1xuXG4gICAgZnVuY3Rpb24gaHR0cDJQdXNoKHN0cmVhbTogU2VydmVySHR0cDJTdHJlYW0sIHBhdGhuYW1lLCB1cmxzOiByZWFkb25seSBzdHJpbmdbXSkge1xuICAgICAgICBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UodXJsKS50aGVuKHJlc291cmNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghc3RyZWFtLnB1c2hBbGxvd2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIm5vdCBhbGxvd2VkIHB1c2hpbmcgZnJvbTpcIiwgcGF0aG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0cmVhbS5wdXNoU3RyZWFtKHtbSFRUUDJfSEVBREVSX1BBVEhdOiB1cmx9LCBmdW5jdGlvbiAoZXJyLCBwdXNoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJjYW5ub3QgcHVzaCBzdHJlYW0gZm9yOlwiLCB1cmwsIFwiZnJvbTpcIiwgcGF0aG5hbWUsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwdXNoLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHVzaC5yc3RDb2RlID09PSBOR0hUVFAyX1JFRlVTRURfU1RSRUFNKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiTkdIVFRQMl9SRUZVU0VEX1NUUkVBTVwiLCB1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIuY29kZSA9PT0gXCJFUlJfSFRUUDJfU1RSRUFNX0VSUk9SXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cud2FybihcIkVSUl9IVFRQMl9TVFJFQU1fRVJST1JcIiwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yKGVyci5jb2RlLCB1cmwsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwdXNoLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHVzaC5yZXNwb25kKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5yZXNvdXJjZS5oZWFkZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiOnN0YXR1c1wiOiBIdHRwU3RhdHVzLk9LXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2guZW5kKHJlc291cmNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiZXJyb3IgcHVzaGluZzpcIiwgdXJsLCBcImZyb206XCIsIHBhdGhuYW1lLCBlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBodHRwMlB1c2hcbiAgICB9O1xufSk7XG4iXX0=