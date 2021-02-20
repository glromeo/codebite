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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx3RUFBbUM7QUFDbkMsa0RBQTBCO0FBQzFCLDJDQUFzQztBQUN0QyxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7OzhDQWM4QztBQUU5QywwQkFBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sSUFBSSxHQUFHLGVBQUs7S0FDYixVQUFVLENBQUMsZUFBZSxDQUFDO0tBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztLQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ1osV0FBVyxFQUFFLDRFQUE0RTtJQUN6RixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLE1BQU0sRUFBRTtJQUNaLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7SUFDdkIsV0FBVyxFQUFFLG9FQUFvRTtJQUNqRixJQUFJLEVBQUUsUUFBUTtDQUNqQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNkLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNaLFdBQVcsRUFBRSx3REFBd0Q7SUFDckUsSUFBSSxFQUFFLFFBQVE7Q0FDakIsQ0FBQztLQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUU7SUFDYixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsT0FBTztJQUNwQixJQUFJLEVBQUUsU0FBUztDQUNsQixDQUFDO0tBQ0QsTUFBTSxDQUFDLFlBQVksRUFBRTtJQUNsQixLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDWixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLElBQUksRUFBRSxTQUFTO0NBQ2xCLENBQUM7S0FDRCxJQUFJLEVBQUU7S0FDTixLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztLQUNsQixJQUFJLENBQUM7QUFFVixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUV0RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztBQUNoQyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFM0Isb0JBQVcsQ0FBQyxxQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBRXhDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0MsMEJBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUNsQywwQkFBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzVCLDBCQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDL0IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUNwQiwwQkFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztBQUVQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNiLDBCQUFHLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XG5pbXBvcnQgeWFyZ3MgZnJvbSBcInlhcmdzXCI7XG5pbXBvcnQge2NvbmZpZ3VyZX0gZnJvbSBcIi4vY29uZmlndXJlXCI7XG5pbXBvcnQge3N0YXJ0U2VydmVyfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSA4paI4paI4paI4paI4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4pSAKlxuICrilIDilojilojilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilojilojilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilpHilpHilpHilpHilojilojilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKUgOKUgOKUgCpcbiAq4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4paI4paI4paR4paR4paI4paI4pSA4pSA4pSAKlxuICrilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilojilojilpHilpHilojilojilIDilIDilIAqXG4gKuKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKUgOKWiOKWiOKWiOKWiOKWkeKWkeKWiOKWiOKWiOKWiOKUgCpcbiAq4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paI4paI4pSA4paI4paI4paR4paR4paR4paR4paR4paR4paI4paI4pSAKlxuICrilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilojilojilojilojilIDilojilojilojilojilojilojilojilojilojilojilIAqXG4gKuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxubG9nLmluZm8oXCJzdGFydGluZyBzZXJ2ZXIuLi5cIik7XG5cbmNvbnN0IGFyZ3MgPSB5YXJnc1xuICAgIC5zY3JpcHROYW1lKFwiZXNuZXh0LXNlcnZlclwiKVxuICAgIC51c2FnZShcIiQwIDxjbWQ+IFthcmdzXVwiKVxuICAgIC5vcHRpb24oXCJjb25maWdcIiwge1xuICAgICAgICBhbGlhczogW1wiY1wiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiU3BlY2lmeSBzZXJ2ZXIgY29uZmlnIGZpbGUgKHRoaXMgd2lsbCBvdmVycmlkZSBiYXNlIGNvbmZpZyBhcyBhcHByb3ByaWF0ZSlcIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgIH0pXG4gICAgLm9wdGlvbihcInJvb3RcIiwge1xuICAgICAgICBhbGlhczogW1wicm9vdERpclwiLCBcInJcIl0sXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcInJvb3QgZGlyZWN0b3J5IChkZWZhdWx0cyB0byB0aGUgcHJvY2VzcyBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5KVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgfSlcbiAgICAub3B0aW9uKFwibW9kdWxlXCIsIHtcbiAgICAgICAgYWxpYXM6IFtcIm1cIl0sXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBtb2R1bGUgdG8gdGhlIHNlcnZlciAoYSBtb2R1bGUgaXMgYSBzZXJ2ZXIgcGx1Z2luKVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgfSlcbiAgICAub3B0aW9uKFwiZGVidWdcIiwge1xuICAgICAgICBhbGlhczogW1wiZFwiXSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiZGVidWdcIixcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICB9KVxuICAgIC5vcHRpb24oXCJwcm9kdWN0aW9uXCIsIHtcbiAgICAgICAgYWxpYXM6IFtcInBcIl0sXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcInByb2R1Y3Rpb24gbW9kZVwiLFxuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgIH0pXG4gICAgLmhlbHAoKVxuICAgIC5hbGlhcyhcImhlbHBcIiwgXCJoXCIpXG4gICAgLmFyZ3Y7XG5cbnByb2Nlc3MuZW52Lk5PREVfRU5WID0gYXJncy5wcm9kdWN0aW9uID8gXCJwcm9kdWN0aW9uXCIgOiBcImRldmVsb3BtZW50XCI7XG5cbmNvbnN0IFNIVVRET1dOX1RJTUVPVVQgPSAxMjAwMDA7XG5jb25zdCBURVJNSU5BVEVEX0JZX0NUUkxfQyA9IDEzMDtcbmNvbnN0IENBTk5PVF9FWEVDVVRFID0gMTI2O1xuXG5zdGFydFNlcnZlcihjb25maWd1cmUoYXJncykpLnRoZW4ocnVudGltZSA9PiB7XG5cbiAgICBwcm9jZXNzLm9uKFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIChyZWFzb24sIHApID0+IHtcbiAgICAgICAgbG9nLmVycm9yKFwiVW5oYW5kbGVkIFJlamVjdGlvbiBhdCBQcm9taXNlXCIsIHAsIHJlYXNvbik7XG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZXJyID0+IHtcbiAgICAgICAgbG9nLmVycm9yKFwiVW5jYXVnaHQgRXhjZXB0aW9uIHRocm93blwiLCBlcnIpO1xuICAgIH0pO1xuXG4gICAgcHJvY2Vzcy5vbihcIlNJR0lOVFwiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGxvZy5pbmZvKFwiY3RybCtjIGRldGVjdGVkLi4uXCIpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShkb25lID0+IHtcbiAgICAgICAgICAgIHJ1bnRpbWUuc2h1dGRvd24oKS50aGVuKGRvbmUpO1xuICAgICAgICAgICAgc2V0VGltZW91dChkb25lLCBTSFVURE9XTl9USU1FT1VUKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHByb2Nlc3MuZXhpdChURVJNSU5BVEVEX0JZX0NUUkxfQyk7XG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCAoKSA9PiB7XG4gICAgICAgIGxvZy5pbmZvKFwiZG9uZVwiKTtcbiAgICB9KTtcblxufSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGxvZy5lcnJvcihcInVuYWJsZSB0byBzdGFydCBzZXJ2ZXJcIiwgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdChDQU5OT1RfRVhFQ1VURSk7XG59KTtcblxuIl19