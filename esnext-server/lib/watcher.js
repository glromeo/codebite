const log = require("@codebite/logger");
const chalk = require("chalk");

const chokidar = require("chokidar");

module.exports.createWatcher = function (config = {rootDir: process.cwd()}) {

    const options = Object.assign({
        cwd: config.rootDir,
        atomic: false
    }, config.watcher);

    log.debug("created chokidar watcher for cwd:", options.cwd);

    const watcher = chokidar.watch([], options);

    watcher.on("all", (event, file) => log.debug("watcher", event, file));
    watcher.on("ready", () => log.info("workspace watcher is", chalk.bold("ready")));

    return watcher;
};