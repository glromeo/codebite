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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx3RUFBbUM7QUFDbkMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QywwQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsZUFBZSxDQUFDO0tBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztLQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDRFQUE0RTtJQUN6RixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE1BQU0sRUFBRTtJQUNaLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7SUFDdkIsV0FBVyxFQUFFLG9FQUFvRTtJQUNqRixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNkLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSx3REFBd0Q7SUFDckUsSUFBSSxFQUFFLFFBQVE7Q0FDakIsQ0FBQztLQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUU7SUFDYixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsT0FBTztJQUNwQixJQUFJLEVBQUUsU0FBUztDQUNsQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFlBQVksRUFBRTtJQUNsQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFJLENBQUM7QUFFVixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUV0RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFM0Isb0JBQVcsQ0FBQyxxQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBRXhDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0MsMEJBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUNsQywwQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzVCLDBCQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDL0IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUNwQiwwQkFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztBQUVQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNiLDBCQUFHLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHlhcmdzIGZyb20gXCJ5YXJnc1wiO1xyXG5pbXBvcnQge2NvbmZpZ3VyZX0gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2ZXJ9IGZyb20gXCIuL3NlcnZlclwiO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgCpcclxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcclxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXHJcbiAq4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paR4paR4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paR4paR4paI4paI4paI4paI4pSAKlxyXG4gKuKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWkeKWkeKWkeKWkeKWiOKWiOKUgCpcclxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilIAqXHJcbiAq4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAKlxyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5sb2cuaW5mbyhcInN0YXJ0aW5nIHNlcnZlci4uLlwiKTtcclxuXHJcbmNvbnN0IGFyZ3MgPSB5YXJnc1xyXG4gICAgLnNjcmlwdE5hbWUoXCJlc25leHQtc2VydmVyXCIpXHJcbiAgICAudXNhZ2UoXCIkMCA8Y21kPiBbYXJnc11cIilcclxuICAgIC5vcHRpb24oXCJjb25maWdcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJjXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlNwZWNpZnkgc2VydmVyIGNvbmZpZyBmaWxlICh0aGlzIHdpbGwgb3ZlcnJpZGUgYmFzZSBjb25maWcgYXMgYXBwcm9wcmlhdGUpXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJyb290XCIsIHtcclxuICAgICAgICBhbGlhczogW1wicm9vdERpclwiLCBcInJcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwicm9vdCBkaXJlY3RvcnkgKGRlZmF1bHRzIHRvIHRoZSBwcm9jZXNzIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkpXCIsXHJcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgfSlcclxuICAgIC5vcHRpb24oXCJtb2R1bGVcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJtXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBtb2R1bGUgdG8gdGhlIHNlcnZlciAoYSBtb2R1bGUgaXMgYSBzZXJ2ZXIgcGx1Z2luKVwiLFxyXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgIH0pXHJcbiAgICAub3B0aW9uKFwiZGVidWdcIiwge1xyXG4gICAgICAgIGFsaWFzOiBbXCJkXCJdLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcImRlYnVnXCIsXHJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcclxuICAgIH0pXHJcbiAgICAub3B0aW9uKFwicHJvZHVjdGlvblwiLCB7XHJcbiAgICAgICAgYWxpYXM6IFtcInBcIl0sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwicHJvZHVjdGlvbiBtb2RlXCIsXHJcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcclxuICAgIH0pXHJcbiAgICAuaGVscCgpXHJcbiAgICAuYWxpYXMoXCJoZWxwXCIsIFwiaFwiKVxyXG4gICAgLmFyZ3Y7XHJcblxyXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9IGFyZ3MucHJvZHVjdGlvbiA/IFwicHJvZHVjdGlvblwiIDogXCJkZXZlbG9wbWVudFwiO1xyXG5cclxuY29uc3QgU0hVVERPV05fVElNRU9VVCA9IDEyMDAwMDtcclxuY29uc3QgVEVSTUlOQVRFRF9CWV9DVFJMX0MgPSAxMzA7XHJcbmNvbnN0IENBTk5PVF9FWEVDVVRFID0gMTI2O1xyXG5cclxuc3RhcnRTZXJ2ZXIoY29uZmlndXJlKGFyZ3MpKS50aGVuKHJ1bnRpbWUgPT4ge1xyXG5cclxuICAgIHByb2Nlc3Mub24oXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgKHJlYXNvbiwgcCkgPT4ge1xyXG4gICAgICAgIGxvZy5lcnJvcihcIlVuaGFuZGxlZCBSZWplY3Rpb24gYXQgUHJvbWlzZVwiLCBwLCByZWFzb24pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGVyciA9PiB7XHJcbiAgICAgICAgbG9nLmVycm9yKFwiVW5jYXVnaHQgRXhjZXB0aW9uIHRocm93blwiLCBlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcHJvY2Vzcy5vbihcIlNJR0lOVFwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgbG9nLmluZm8oXCJjdHJsK2MgZGV0ZWN0ZWQuLi5cIik7XHJcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoZG9uZSA9PiB7XHJcbiAgICAgICAgICAgIHJ1bnRpbWUuc2h1dGRvd24oKS50aGVuKGRvbmUpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvbmUsIFNIVVRET1dOX1RJTUVPVVQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHByb2Nlc3MuZXhpdChURVJNSU5BVEVEX0JZX0NUUkxfQyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgbG9nLmluZm8oXCJkb25lXCIpO1xyXG4gICAgfSk7XHJcblxyXG59KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICBsb2cuZXJyb3IoXCJ1bmFibGUgdG8gc3RhcnQgc2VydmVyXCIsIGVycm9yKTtcclxuICAgIHByb2Nlc3MuZXhpdChDQU5OT1RfRVhFQ1VURSk7XHJcbn0pO1xyXG5cclxuIl19