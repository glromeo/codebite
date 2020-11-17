const path = require("path");

module.exports = {
    mount: {
        "/public": path.resolve("./public"),
        "/fixture": path.resolve("../fixture"),
        "/test": path.resolve("../test")
    },
    babel: {
        plugins: [
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
        ]
    },
    logLevel: "debug"
};
