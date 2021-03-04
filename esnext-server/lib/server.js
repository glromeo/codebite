"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.DEFAULT_SERVER_OPTIONS = void 0;
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const messaging_1 = require("./messaging");
const request_handler_1 = require("./request-handler");
const watcher_1 = require("./watcher");
exports.DEFAULT_SERVER_OPTIONS = {
    protocol: "http",
    host: "localhost",
    port: 3000
};
async function startServer(options) {
    const { server: { protocol, host, port, options: { key, cert, allowHTTP1 } = {} } = exports.DEFAULT_SERVER_OPTIONS } = options;
    const watcher = watcher_1.useWatcher(options);
    const handler = request_handler_1.useRequestHandler(options);
    let module, server;
    if (options.http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer({ allowHTTP1 }, handler);
        }
        else {
            server = module.createSecureServer({ key, cert, allowHTTP1 }, handler);
        }
    }
    else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(handler);
        }
        else {
            module = require("https");
            server = module.createServer({ key, cert }, handler);
        }
    }
    server.on("upgrade", messaging_1.useMessaging(options).handleUpgrade);
    await new Promise(listening => server.listen(port, host, listening));
    const address = `${protocol}://${host}:${port}`;
    tiny_node_logger_1.default.info(`server started on ${address}`);
    const sockets = new Set();
    for (const event of ["connection", "secureConnection"])
        server.on(event, function (socket) {
            sockets.add(socket);
            socket.on("close", () => sockets.delete(socket));
        });
    let closed;
    async function shutdown() {
        if (closed) {
            tiny_node_logger_1.default.debug("shutdown in progress...");
            await closed;
        }
        closed = new Promise(closed => server.on("close", closed));
        if (sockets.size > 0) {
            tiny_node_logger_1.default.debug(`closing ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }
        tiny_node_logger_1.default.debug(`closing chokidar watcher...`);
        await watcher.close();
        server.close();
        await closed;
        tiny_node_logger_1.default.info("server closed");
        return closed;
    }
    return {
        options,
        module,
        server,
        watcher,
        handler,
        address,
        shutdown
    };
}
exports.startServer = startServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSx3RUFBbUM7QUFDbkMsMkNBQXlDO0FBRXpDLHVEQUFvRDtBQUNwRCx1Q0FBcUM7QUFheEIsUUFBQSxzQkFBc0IsR0FBa0I7SUFDakQsUUFBUSxFQUFFLE1BQU07SUFDaEIsSUFBSSxFQUFFLFdBQVc7SUFDakIsSUFBSSxFQUFFLElBQUk7Q0FDYixDQUFDO0FBT0ssS0FBSyxVQUFVLFdBQVcsQ0FBQyxPQUFzQjtJQUVwRCxNQUFNLEVBQ0YsTUFBTSxFQUFFLEVBQ0osUUFBUSxFQUNSLElBQUksRUFDSixJQUFJLEVBQ0osT0FBTyxFQUFFLEVBQ0wsR0FBRyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQ3hCLEdBQUcsRUFBUyxFQUNoQixHQUFHLDhCQUFzQixFQUM3QixHQUFHLE9BQU8sQ0FBQztJQUVaLE1BQU0sT0FBTyxHQUFHLG9CQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEMsTUFBTSxPQUFPLEdBQUcsbUNBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFM0MsSUFBSSxNQUFNLEVBQUUsTUFBOEMsQ0FBQztJQUUzRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDZixNQUFNLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRTtZQUNyQixNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFDLFVBQVUsRUFBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZEO2FBQU07WUFDSCxNQUFNLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEVBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN4RTtLQUNKO1NBQU07UUFDSCxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUU7WUFDckIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN6QzthQUFNO1lBQ0gsTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQixNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN0RDtLQUNKO0lBRUQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsd0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUUxRCxNQUFNLElBQUksT0FBTyxDQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFM0UsTUFBTSxPQUFPLEdBQUcsR0FBRyxRQUFRLE1BQU0sSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2hELDBCQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBRXpDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFFbEMsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQztRQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLFVBQVUsTUFBTTtZQUNyRixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksTUFBTSxDQUFDO0lBRVgsS0FBSyxVQUFVLFFBQVE7UUFDbkIsSUFBSSxNQUFNLEVBQUU7WUFDUiwwQkFBRyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxDQUFDO1NBQ2hCO1FBRUQsTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUUzRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFO1lBQ2xCLDBCQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsT0FBTyxDQUFDLElBQUksb0JBQW9CLENBQUMsQ0FBQztZQUN2RCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtnQkFDMUIsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzFCO1NBQ0o7UUFFRCwwQkFBRyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXRCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLE1BQU0sTUFBTSxDQUFDO1FBQ2IsMEJBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFMUIsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELE9BQU87UUFDSCxPQUFPO1FBQ1AsTUFBTTtRQUNOLE1BQU07UUFDTixPQUFPO1FBQ1AsT0FBTztRQUNQLE9BQU87UUFDUCxRQUFRO0tBQ1gsQ0FBQztBQUNOLENBQUM7QUF0RkQsa0NBc0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGU1dhdGNoZXJ9IGZyb20gXCJjaG9raWRhclwiO1xyXG5pbXBvcnQge0hhbmRsZXIsIEhUVFBWZXJzaW9ufSBmcm9tIFwiZmluZC1teS13YXlcIjtcclxuaW1wb3J0IHtTZXJ2ZXIgYXMgSHR0cFNlcnZlcn0gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IHtIdHRwMlNlcnZlcn0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCB7U2VydmVyIGFzIEh0dHBzU2VydmVyfSBmcm9tIFwiaHR0cHNcIjtcclxuaW1wb3J0IHtTb2NrZXR9IGZyb20gXCJuZXRcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge3VzZU1lc3NhZ2luZ30gZnJvbSBcIi4vbWVzc2FnaW5nXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7dXNlUmVxdWVzdEhhbmRsZXJ9IGZyb20gXCIuL3JlcXVlc3QtaGFuZGxlclwiO1xyXG5pbXBvcnQge3VzZVdhdGNoZXJ9IGZyb20gXCIuL3dhdGNoZXJcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFNlcnZlck9wdGlvbnMgPSB7XHJcbiAgICBwcm90b2NvbD86IFwiaHR0cFwiIHwgXCJodHRwc1wiXHJcbiAgICBob3N0Pzogc3RyaW5nXHJcbiAgICBwb3J0PzogbnVtYmVyXHJcbiAgICBvcHRpb25zPzoge1xyXG4gICAgICAgIGtleT86IHN0cmluZ1xyXG4gICAgICAgIGNlcnQ/OiBzdHJpbmdcclxuICAgICAgICBhbGxvd0hUVFAxPzogYm9vbGVhblxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVJWRVJfT1BUSU9OUzogU2VydmVyT3B0aW9ucyA9IHtcclxuICAgIHByb3RvY29sOiBcImh0dHBcIixcclxuICAgIGhvc3Q6IFwibG9jYWxob3N0XCIsXHJcbiAgICBwb3J0OiAzMDAwXHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBTZXJ2aWNlcyA9IHtcclxuICAgIHdhdGNoZXI/OiBGU1dhdGNoZXJcclxuICAgIGhhbmRsZXI/OiBIYW5kbGVyPEhUVFBWZXJzaW9uLlYxIHwgSFRUUFZlcnNpb24uVjI+XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydFNlcnZlcihvcHRpb25zOiBFU05leHRPcHRpb25zKSB7XHJcblxyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIHNlcnZlcjoge1xyXG4gICAgICAgICAgICBwcm90b2NvbCxcclxuICAgICAgICAgICAgaG9zdCxcclxuICAgICAgICAgICAgcG9ydCxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAga2V5LCBjZXJ0LCBhbGxvd0hUVFAxXHJcbiAgICAgICAgICAgIH0gPSB7fSBhcyBhbnlcclxuICAgICAgICB9ID0gREVGQVVMVF9TRVJWRVJfT1BUSU9OU1xyXG4gICAgfSA9IG9wdGlvbnM7XHJcblxyXG4gICAgY29uc3Qgd2F0Y2hlciA9IHVzZVdhdGNoZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCBoYW5kbGVyID0gdXNlUmVxdWVzdEhhbmRsZXIob3B0aW9ucyk7XHJcblxyXG4gICAgbGV0IG1vZHVsZSwgc2VydmVyOiBIdHRwU2VydmVyIHwgSHR0cHNTZXJ2ZXIgfCBIdHRwMlNlcnZlcjtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5odHRwMikge1xyXG4gICAgICAgIG1vZHVsZSA9IHJlcXVpcmUoXCJodHRwMlwiKTtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKSB7XHJcbiAgICAgICAgICAgIHNlcnZlciA9IG1vZHVsZS5jcmVhdGVTZXJ2ZXIoe2FsbG93SFRUUDF9LCBoYW5kbGVyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXJ2ZXIgPSBtb2R1bGUuY3JlYXRlU2VjdXJlU2VydmVyKHtrZXksIGNlcnQsIGFsbG93SFRUUDF9LCBoYW5kbGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpIHtcclxuICAgICAgICAgICAgbW9kdWxlID0gcmVxdWlyZShcImh0dHBcIik7XHJcbiAgICAgICAgICAgIHNlcnZlciA9IG1vZHVsZS5jcmVhdGVTZXJ2ZXIoaGFuZGxlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbW9kdWxlID0gcmVxdWlyZShcImh0dHBzXCIpO1xyXG4gICAgICAgICAgICBzZXJ2ZXIgPSBtb2R1bGUuY3JlYXRlU2VydmVyKHtrZXksIGNlcnR9LCBoYW5kbGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2VydmVyLm9uKFwidXBncmFkZVwiLCB1c2VNZXNzYWdpbmcob3B0aW9ucykuaGFuZGxlVXBncmFkZSk7XHJcblxyXG4gICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4obGlzdGVuaW5nID0+IHNlcnZlci5saXN0ZW4ocG9ydCwgaG9zdCwgbGlzdGVuaW5nKSk7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGAke3Byb3RvY29sfTovLyR7aG9zdH06JHtwb3J0fWA7XHJcbiAgICBsb2cuaW5mbyhgc2VydmVyIHN0YXJ0ZWQgb24gJHthZGRyZXNzfWApO1xyXG5cclxuICAgIGNvbnN0IHNvY2tldHMgPSBuZXcgU2V0PFNvY2tldD4oKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIFtcImNvbm5lY3Rpb25cIiwgXCJzZWN1cmVDb25uZWN0aW9uXCJdKSBzZXJ2ZXIub24oZXZlbnQsIGZ1bmN0aW9uIChzb2NrZXQpIHtcclxuICAgICAgICBzb2NrZXRzLmFkZChzb2NrZXQpO1xyXG4gICAgICAgIHNvY2tldC5vbihcImNsb3NlXCIsICgpID0+IHNvY2tldHMuZGVsZXRlKHNvY2tldCkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgbGV0IGNsb3NlZDtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBzaHV0ZG93bih0aGlzOiBhbnkpIHtcclxuICAgICAgICBpZiAoY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInNodXRkb3duIGluIHByb2dyZXNzLi4uXCIpO1xyXG4gICAgICAgICAgICBhd2FpdCBjbG9zZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjbG9zZWQgPSBuZXcgUHJvbWlzZShjbG9zZWQgPT4gc2VydmVyLm9uKFwiY2xvc2VcIiwgY2xvc2VkKSk7XHJcblxyXG4gICAgICAgIGlmIChzb2NrZXRzLnNpemUgPiAwKSB7XHJcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhgY2xvc2luZyAke3NvY2tldHMuc2l6ZX0gcGVuZGluZyBzb2NrZXQuLi5gKTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBzb2NrZXQgb2Ygc29ja2V0cykge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldHMuZGVsZXRlKHNvY2tldCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvZy5kZWJ1ZyhgY2xvc2luZyBjaG9raWRhciB3YXRjaGVyLi4uYCk7XHJcbiAgICAgICAgYXdhaXQgd2F0Y2hlci5jbG9zZSgpO1xyXG5cclxuICAgICAgICBzZXJ2ZXIuY2xvc2UoKTtcclxuICAgICAgICBhd2FpdCBjbG9zZWQ7XHJcbiAgICAgICAgbG9nLmluZm8oXCJzZXJ2ZXIgY2xvc2VkXCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gY2xvc2VkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICBtb2R1bGUsXHJcbiAgICAgICAgc2VydmVyLFxyXG4gICAgICAgIHdhdGNoZXIsXHJcbiAgICAgICAgaGFuZGxlcixcclxuICAgICAgICBhZGRyZXNzLFxyXG4gICAgICAgIHNodXRkb3duXHJcbiAgICB9O1xyXG59XHJcbiJdfQ==