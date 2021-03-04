#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const yargs_1 = __importDefault(require("yargs"));
const configure_1 = require("./configure");
const server_1 = require("./server");
require('source-map-support').install();
/********************************************
 *──────────────────────────────────────────*
 *─██████████████─██████─────────██████████─*
 *─██░░░░░░░░░░██─██░░██─────────██░░░░░░██─*
 *─██░░██████████─██░░██─────────████░░████─*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██─────────██░░██───────────██░░██───*
 *─██░░██████████─██░░██████████─████░░████─*
 *─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░░░░░██─*
 *─██████████████─██████████████─██████████─*
 *──────────────────────────────────────────*
 ********************************************/
tiny_node_logger_1.default.info("starting server...");
const args = yargs_1.default
    .scriptName("esnext-server")
    .usage("$0 <cmd> [args]")
    .option("config", {
    alias: ["c"],
    description: "Specify server config file (this will override base config as appropriate)",
    type: "string"
})
    .option("root", {
    alias: ["rootDir", "r"],
    description: "root directory (defaults to the process current working directory)",
    type: "string"
})
    .option("plugin", {
    alias: ["m"],
    description: "Add plugin to the server",
    type: "string"
})
    .option("debug", {
    alias: ["d"],
    description: "debug",
    type: "boolean"
})
    .option("production", {
    alias: ["p"],
    description: "production mode",
    type: "boolean"
})
    .help()
    .alias("help", "h")
    .argv;
process.env.NODE_ENV = args.production ? "production" : "development";
const SHUTDOWN_TIMEOUT = 120000;
const TERMINATED_BY_CTRL_C = 130;
const CANNOT_EXECUTE = 126;
server_1.startServer(configure_1.configure(args)).then(runtime => {
    process.on("unhandledRejection", (reason, p) => {
        tiny_node_logger_1.default.error("Unhandled Rejection at Promise", p, reason);
    });
    process.on("uncaughtException", err => {
        tiny_node_logger_1.default.error("Uncaught Exception thrown", err);
    });
    process.on("SIGINT", async () => {
        tiny_node_logger_1.default.info("ctrl+c detected...");
        await new Promise(done => {
            runtime.shutdown().then(done);
            setTimeout(done, SHUTDOWN_TIMEOUT);
        });
        process.exit(TERMINATED_BY_CTRL_C);
    });
    process.on("exit", () => {
        tiny_node_logger_1.default.info("done");
    });
}).catch(error => {
    tiny_node_logger_1.default.error("unable to start server", error);
    process.exit(CANNOT_EXECUTE);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSx3RUFBbUM7QUFDbkMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QywwQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsZUFBZSxDQUFDO0tBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztLQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDRFQUE0RTtJQUN6RixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE1BQU0sRUFBRTtJQUNaLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7SUFDdkIsV0FBVyxFQUFFLG9FQUFvRTtJQUNqRixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNkLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSwwQkFBMEI7SUFDdkMsSUFBSSxFQUFFLFFBQVE7Q0FDakIsQ0FBQztLQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUU7SUFDYixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsT0FBTztJQUNwQixJQUFJLEVBQUUsU0FBUztDQUNsQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFlBQVksRUFBRTtJQUNsQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFJLENBQUM7QUFFVixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUV0RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFM0Isb0JBQVcsQ0FBQyxxQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBRXhDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0MsMEJBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUNsQywwQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzVCLDBCQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDL0IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUNwQiwwQkFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztBQUVQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNiLDBCQUFHLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB5YXJncyBmcm9tIFwieWFyZ3NcIjtcclxuaW1wb3J0IHtjb25maWd1cmV9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3N0YXJ0U2VydmVyfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcclxuXHJcbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcclxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilojilojilojilojilojilojilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXHJcbiAq4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxubG9nLmluZm8oXCJzdGFydGluZyBzZXJ2ZXIuLi5cIik7XHJcblxyXG5jb25zdCBhcmdzID0geWFyZ3NcclxuICAgIC5zY3JpcHROYW1lKFwiZXNuZXh0LXNlcnZlclwiKVxyXG4gICAgLnVzYWdlKFwiJDAgPGNtZD4gW2FyZ3NdXCIpXHJcbiAgICAub3B0aW9uKFwiY29uZmlnXCIsIHtcclxuICAgICAgICBhbGlhczogW1wiY1wiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTcGVjaWZ5IHNlcnZlciBjb25maWcgZmlsZSAodGhpcyB3aWxsIG92ZXJyaWRlIGJhc2UgY29uZmlnIGFzIGFwcHJvcHJpYXRlKVwiLFxyXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgIH0pXHJcbiAgICAub3B0aW9uKFwicm9vdFwiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcInJvb3REaXJcIiwgXCJyXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcInJvb3QgZGlyZWN0b3J5IChkZWZhdWx0cyB0byB0aGUgcHJvY2VzcyBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5KVwiLFxyXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgIH0pXHJcbiAgICAub3B0aW9uKFwicGx1Z2luXCIsIHtcclxuICAgICAgICBhbGlhczogW1wibVwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJBZGQgcGx1Z2luIHRvIHRoZSBzZXJ2ZXJcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcImRlYnVnXCIsIHtcclxuICAgICAgICBhbGlhczogW1wiZFwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJkZWJ1Z1wiLFxyXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInByb2R1Y3Rpb25cIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJwXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcInByb2R1Y3Rpb24gbW9kZVwiLFxyXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXHJcbiAgICB9KVxyXG4gICAgLmhlbHAoKVxyXG4gICAgLmFsaWFzKFwiaGVscFwiLCBcImhcIilcclxuICAgIC5hcmd2O1xyXG5cclxucHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSBhcmdzLnByb2R1Y3Rpb24gPyBcInByb2R1Y3Rpb25cIiA6IFwiZGV2ZWxvcG1lbnRcIjtcclxuXHJcbmNvbnN0IFNIVVRET1dOX1RJTUVPVVQgPSAxMjAwMDA7XHJcbmNvbnN0IFRFUk1JTkFURURfQllfQ1RSTF9DID0gMTMwO1xyXG5jb25zdCBDQU5OT1RfRVhFQ1VURSA9IDEyNjtcclxuXHJcbnN0YXJ0U2VydmVyKGNvbmZpZ3VyZShhcmdzKSkudGhlbihydW50aW1lID0+IHtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIChyZWFzb24sIHApID0+IHtcclxuICAgICAgICBsb2cuZXJyb3IoXCJVbmhhbmRsZWQgUmVqZWN0aW9uIGF0IFByb21pc2VcIiwgcCwgcmVhc29uKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBlcnIgPT4ge1xyXG4gICAgICAgIGxvZy5lcnJvcihcIlVuY2F1Z2h0IEV4Y2VwdGlvbiB0aHJvd25cIiwgZXJyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJTSUdJTlRcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGxvZy5pbmZvKFwiY3RybCtjIGRldGVjdGVkLi4uXCIpO1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKGRvbmUgPT4ge1xyXG4gICAgICAgICAgICBydW50aW1lLnNodXRkb3duKCkudGhlbihkb25lKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dChkb25lLCBTSFVURE9XTl9USU1FT1VUKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBwcm9jZXNzLmV4aXQoVEVSTUlOQVRFRF9CWV9DVFJMX0MpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcImV4aXRcIiwgKCkgPT4ge1xyXG4gICAgICAgIGxvZy5pbmZvKFwiZG9uZVwiKTtcclxuICAgIH0pO1xyXG5cclxufSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgbG9nLmVycm9yKFwidW5hYmxlIHRvIHN0YXJ0IHNlcnZlclwiLCBlcnJvcik7XHJcbiAgICBwcm9jZXNzLmV4aXQoQ0FOTk9UX0VYRUNVVEUpO1xyXG59KTtcclxuXHJcbiJdfQ==