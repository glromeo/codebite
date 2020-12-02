const log = require("tiny-node-logger");
const {parse: parseURL} = require("fast-url-parser");

const snapshotMiddleware = require("./lib/endpoint/snapshot-reporter.js");

const configurationMiddleware = function (router, config) {

    router.get("/workbench.config", function (req, res) {
        log.debug("workbench configuration");
        if (config.workbench) {
            res.writeHead(200, {
                "content-type": "application/json; charset=UTF-8"
            });
            const cfg = {...config.workbench};
            for (const key of Object.keys(cfg)) {
                if (typeof cfg[key] === "function") {
                    cfg[key] = {__function__: cfg[key].toString()};
                }
            }
            res.end(JSON.stringify(cfg));
        } else {
            res.writeHead(404);
            res.end();
        }
    });
};

module.exports = {

    mount: {
        "/workbench": __dirname
    },

    transform: {
        exclude: ["/workbench/dist/**"]
    },

    babel: {
        plugins: [
            ["babel-plugin-istanbul", {"exclude": ["**/*.test.js", "**/*.test.mjs"]}]
        ]
    },

    watcher: {
        ignored: ["coverage/**"],
    },

    workbench: {
        random: false,
        failFast: false,
        oneFailurePerSpec: false,
        hideDisabled: false,
        specFiler: spec => true
    },

    middleware: [
        configurationMiddleware,
        snapshotMiddleware
    ],

    web_modules: {
        standalone: [
            "smooth-scrollbar"
        ]
    }
};
