const debounce = require("debounce");

module.exports = function ReloadPlugin(config, watcher) {
    return {
        connected(payload, send) {
            const reload = debounce(path => send("reload", {changed: path}));
            watcher.on("change", reload);
            watcher.on("unlink", reload);
        }
    }
};

