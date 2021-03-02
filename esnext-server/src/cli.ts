#!/usr/bin/env node
import log from "tiny-node-logger";
import yargs from "yargs";
import {configure} from "./configure";
import {startServer} from "./server";

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

log.info("starting server...");

const args = yargs
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

startServer(configure(args)).then(runtime => {

    process.on("unhandledRejection", (reason, p) => {
        log.error("Unhandled Rejection at Promise", p, reason);
    });

    process.on("uncaughtException", err => {
        log.error("Uncaught Exception thrown", err);
    });

    process.on("SIGINT", async () => {
        log.info("ctrl+c detected...");
        await new Promise(done => {
            runtime.shutdown().then(done);
            setTimeout(done, SHUTDOWN_TIMEOUT);
        });
        process.exit(TERMINATED_BY_CTRL_C);
    });

    process.on("exit", () => {
        log.info("done");
    });

}).catch(error => {
    log.error("unable to start server", error);
    process.exit(CANNOT_EXECUTE);
});

