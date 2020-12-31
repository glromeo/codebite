module.exports = {
    mount: {
        "/workbench": "../workbench",
        "/@codebite": "../",
        "/node_modules": "../../node_modules"
    },
    babel: {
        filename: "file.jsx",
        presets: ["@babel/preset-react"],
        plugins: [
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
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
    nodeModules: [require("path").resolve(__dirname, "../../node_modules")],
    web_modules: {
        terser: false
    },
    resolve: {
        rootDir: __dirname,
        paths: [require("path").resolve(__dirname, "../../node_modules")]
    },
    dummies: {
        "react/cjs/react.production.min.js": `module.exports = {};`,
        "react-dom/cjs/react-dom.production.min.js": `module.exports = {};`,
        "scheduler/cjs/scheduler.production.min.js": `module.exports = {};`,
        "scheduler/cjs/scheduler-tracing.production.min.js": `module.exports = {};`
    },
    squash: [
        "@babel/runtime/**"
    ]
};
