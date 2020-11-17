const {resolve} = require("path");
const {readFileSync} = require("fs");

const rootDir = __dirname;

module.exports = {
    rootDir: rootDir,
    nodeModules: [resolve(rootDir, "node_modules"), resolve(rootDir, "..", "node_modules")],
    webModules: resolve(rootDir, "web_modules"),
    mount: {
        "/workbench": "../workbench",
        "/@codebite": "../",
        "/node_modules": "../node_modules"
    },
    babel: {
        filename: "file.jsx",
        presets: ["babel-preset-react-app"],
        plugins: [
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"],
            ["@babel/plugin-transform-runtime", {
                "corejs": false,
                "helpers": true,
                "regenerator": false,
                "useESModules": true,
                "absoluteRuntime": true,
                "version": "7.5.5"
            }]
        ]
    },
    sass: {
        moduleType: "style"
    },
    server: {
        port: 4000
    },
    push: true,
    cache: true,
    clean: false,
    web_modules: {
        terser: false,
        standalone: ["react","react-dom"]
    }
};
