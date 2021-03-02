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
    .option("module", {
    alias: ["m"],
    description: "Add module to the server (a module is a server plugin)",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx3RUFBbUM7QUFDbkMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFeEM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QywwQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsZUFBZSxDQUFDO0tBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztLQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDRFQUE0RTtJQUN6RixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE1BQU0sRUFBRTtJQUNaLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7SUFDdkIsV0FBVyxFQUFFLG9FQUFvRTtJQUNqRixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNkLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSx3REFBd0Q7SUFDckUsSUFBSSxFQUFFLFFBQVE7Q0FDakIsQ0FBQztLQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUU7SUFDYixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsT0FBTztJQUNwQixJQUFJLEVBQUUsU0FBUztDQUNsQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFlBQVksRUFBRTtJQUNsQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFJLENBQUM7QUFFVixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUV0RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFM0Isb0JBQVcsQ0FBQyxxQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBRXhDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0MsMEJBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUNsQywwQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzVCLDBCQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDL0IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUNwQiwwQkFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztBQUVQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNiLDBCQUFHLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XG5pbXBvcnQgeWFyZ3MgZnJvbSBcInlhcmdzXCI7XG5pbXBvcnQge2NvbmZpZ3VyZX0gZnJvbSBcIi4vY29uZmlndXJlXCI7XG5pbXBvcnQge3N0YXJ0U2VydmVyfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcblxucmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilojilojilojilojilojilojilojilojilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXG4gKuKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5sb2cuaW5mbyhcInN0YXJ0aW5nIHNlcnZlci4uLlwiKTtcblxuY29uc3QgYXJncyA9IHlhcmdzXG4gICAgLnNjcmlwdE5hbWUoXCJlc25leHQtc2VydmVyXCIpXG4gICAgLnVzYWdlKFwiJDAgPGNtZD4gW2FyZ3NdXCIpXG4gICAgLm9wdGlvbihcImNvbmZpZ1wiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJjXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJTcGVjaWZ5IHNlcnZlciBjb25maWcgZmlsZSAodGhpcyB3aWxsIG92ZXJyaWRlIGJhc2UgY29uZmlnIGFzIGFwcHJvcHJpYXRlKVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgfSlcbiAgICAub3B0aW9uKFwicm9vdFwiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJyb290RGlyXCIsIFwiclwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwicm9vdCBkaXJlY3RvcnkgKGRlZmF1bHRzIHRvIHRoZSBwcm9jZXNzIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkpXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJtb2R1bGVcIiwge1xuICAgICAgICBhbGlhczogW1wibVwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQWRkIG1vZHVsZSB0byB0aGUgc2VydmVyIChhIG1vZHVsZSBpcyBhIHNlcnZlciBwbHVnaW4pXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJkZWJ1Z1wiLCB7XG4gICAgICAgIGFsaWFzOiBbXCJkXCJdLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJkZWJ1Z1wiLFxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgIH0pXG4gICAgLm9wdGlvbihcInByb2R1Y3Rpb25cIiwge1xuICAgICAgICBhbGlhczogW1wicFwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwicHJvZHVjdGlvbiBtb2RlXCIsXG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgfSlcbiAgICAuaGVscCgpXG4gICAgLmFsaWFzKFwiaGVscFwiLCBcImhcIilcbiAgICAuYXJndjtcblxucHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSBhcmdzLnByb2R1Y3Rpb24gPyBcInByb2R1Y3Rpb25cIiA6IFwiZGV2ZWxvcG1lbnRcIjtcblxuY29uc3QgU0hVVERPV05fVElNRU9VVCA9IDEyMDAwMDtcbmNvbnN0IFRFUk1JTkFURURfQllfQ1RSTF9DID0gMTMwO1xuY29uc3QgQ0FOTk9UX0VYRUNVVEUgPSAxMjY7XG5cbnN0YXJ0U2VydmVyKGNvbmZpZ3VyZShhcmdzKSkudGhlbihydW50aW1lID0+IHtcblxuICAgIHByb2Nlc3Mub24oXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgKHJlYXNvbiwgcCkgPT4ge1xuICAgICAgICBsb2cuZXJyb3IoXCJVbmhhbmRsZWQgUmVqZWN0aW9uIGF0IFByb21pc2VcIiwgcCwgcmVhc29uKTtcbiAgICB9KTtcblxuICAgIHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBlcnIgPT4ge1xuICAgICAgICBsb2cuZXJyb3IoXCJVbmNhdWdodCBFeGNlcHRpb24gdGhyb3duXCIsIGVycik7XG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKFwiU0lHSU5UXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbG9nLmluZm8oXCJjdHJsK2MgZGV0ZWN0ZWQuLi5cIik7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKGRvbmUgPT4ge1xuICAgICAgICAgICAgcnVudGltZS5zaHV0ZG93bigpLnRoZW4oZG9uZSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvbmUsIFNIVVRET1dOX1RJTUVPVVQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KFRFUk1JTkFURURfQllfQ1RSTF9DKTtcbiAgICB9KTtcblxuICAgIHByb2Nlc3Mub24oXCJleGl0XCIsICgpID0+IHtcbiAgICAgICAgbG9nLmluZm8oXCJkb25lXCIpO1xuICAgIH0pO1xuXG59KS5jYXRjaChlcnJvciA9PiB7XG4gICAgbG9nLmVycm9yKFwidW5hYmxlIHRvIHN0YXJ0IHNlcnZlclwiLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KENBTk5PVF9FWEVDVVRFKTtcbn0pO1xuXG4iXX0=