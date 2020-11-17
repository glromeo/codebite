const path = require("path");

module.exports = {
    babel: {
        plugins: [
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
        ]
    },
    push: true,
    cache: true,
    clean: false,
    web_modules: {
        ignored: ["jasmine-core"],
        standalone: ["rxjs"],
        terser: true
    }
};
