module.exports = {
    babel: {
        plugins: [
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
        ]
    },
    http2: "preload",
    cache: true,
    clean: true,
    environment: "development",
    esbuild:{
        minify: false,
        sourcemap: false
    },
    plugins: [
        require("@codebite/workbench/esnext-server.plugin.js"),
        require("esnext-hot-element/")
    ]
};
