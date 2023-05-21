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
(0, server_1.startServer)((0, configure_1.configure)(args)).then(runtime => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSx3RUFBbUM7QUFDbkMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QywwQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsZUFBZSxDQUFDO0tBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztLQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDRFQUE0RTtJQUN6RixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE1BQU0sRUFBRTtJQUNaLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7SUFDdkIsV0FBVyxFQUFFLG9FQUFvRTtJQUNqRixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNkLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSwwQkFBMEI7SUFDdkMsSUFBSSxFQUFFLFFBQVE7Q0FDakIsQ0FBQztLQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUU7SUFDYixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsT0FBTztJQUNwQixJQUFJLEVBQUUsU0FBUztDQUNsQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFlBQVksRUFBRTtJQUNsQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFJLENBQUM7QUFFVixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUV0RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFM0IsSUFBQSxvQkFBVyxFQUFDLElBQUEscUJBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtJQUV4QyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNDLDBCQUFHLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLEVBQUU7UUFDbEMsMEJBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1QiwwQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckIsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixVQUFVLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDcEIsMEJBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDYiwwQkFBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxyXG5pbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQgeWFyZ3MgZnJvbSBcInlhcmdzXCI7XHJcbmltcG9ydCB7Y29uZmlndXJlfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtzdGFydFNlcnZlcn0gZnJvbSBcIi4vc2VydmVyXCI7XHJcblxyXG5yZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKCk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICrilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilojilojilojilojilojilojilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilojilojilpHilpHilojilojilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilojilojilojilojilojilojilojilojilIDilojilojilpHilpHilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilpHilpHilojilojilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAqXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmxvZy5pbmZvKFwic3RhcnRpbmcgc2VydmVyLi4uXCIpO1xyXG5cclxuY29uc3QgYXJncyA9IHlhcmdzXHJcbiAgICAuc2NyaXB0TmFtZShcImVzbmV4dC1zZXJ2ZXJcIilcclxuICAgIC51c2FnZShcIiQwIDxjbWQ+IFthcmdzXVwiKVxyXG4gICAgLm9wdGlvbihcImNvbmZpZ1wiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcImNcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU3BlY2lmeSBzZXJ2ZXIgY29uZmlnIGZpbGUgKHRoaXMgd2lsbCBvdmVycmlkZSBiYXNlIGNvbmZpZyBhcyBhcHByb3ByaWF0ZSlcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInJvb3RcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJyb290RGlyXCIsIFwiclwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJyb290IGRpcmVjdG9yeSAoZGVmYXVsdHMgdG8gdGhlIHByb2Nlc3MgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSlcIixcclxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICB9KVxyXG4gICAgLm9wdGlvbihcInBsdWdpblwiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcIm1cIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQWRkIHBsdWdpbiB0byB0aGUgc2VydmVyXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJkZWJ1Z1wiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcImRcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiZGVidWdcIixcclxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJwcm9kdWN0aW9uXCIsIHtcclxuICAgICAgICBhbGlhczogW1wicFwiXSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJwcm9kdWN0aW9uIG1vZGVcIixcclxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxyXG4gICAgfSlcclxuICAgIC5oZWxwKClcclxuICAgIC5hbGlhcyhcImhlbHBcIiwgXCJoXCIpXHJcbiAgICAuYXJndjtcclxuXHJcbnByb2Nlc3MuZW52Lk5PREVfRU5WID0gYXJncy5wcm9kdWN0aW9uID8gXCJwcm9kdWN0aW9uXCIgOiBcImRldmVsb3BtZW50XCI7XHJcblxyXG5jb25zdCBTSFVURE9XTl9USU1FT1VUID0gMTIwMDAwO1xyXG5jb25zdCBURVJNSU5BVEVEX0JZX0NUUkxfQyA9IDEzMDtcclxuY29uc3QgQ0FOTk9UX0VYRUNVVEUgPSAxMjY7XHJcblxyXG5zdGFydFNlcnZlcihjb25maWd1cmUoYXJncykpLnRoZW4ocnVudGltZSA9PiB7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcInVuaGFuZGxlZFJlamVjdGlvblwiLCAocmVhc29uLCBwKSA9PiB7XHJcbiAgICAgICAgbG9nLmVycm9yKFwiVW5oYW5kbGVkIFJlamVjdGlvbiBhdCBQcm9taXNlXCIsIHAsIHJlYXNvbik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZXJyID0+IHtcclxuICAgICAgICBsb2cuZXJyb3IoXCJVbmNhdWdodCBFeGNlcHRpb24gdGhyb3duXCIsIGVycik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwiU0lHSU5UXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICBsb2cuaW5mbyhcImN0cmwrYyBkZXRlY3RlZC4uLlwiKTtcclxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShkb25lID0+IHtcclxuICAgICAgICAgICAgcnVudGltZS5zaHV0ZG93bigpLnRoZW4oZG9uZSk7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZG9uZSwgU0hVVERPV05fVElNRU9VVCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KFRFUk1JTkFURURfQllfQ1RSTF9DKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJleGl0XCIsICgpID0+IHtcclxuICAgICAgICBsb2cuaW5mbyhcImRvbmVcIik7XHJcbiAgICB9KTtcclxuXHJcbn0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgIGxvZy5lcnJvcihcInVuYWJsZSB0byBzdGFydCBzZXJ2ZXJcIiwgZXJyb3IpO1xyXG4gICAgcHJvY2Vzcy5leGl0KENBTk5PVF9FWEVDVVRFKTtcclxufSk7XHJcblxyXG4iXX0=