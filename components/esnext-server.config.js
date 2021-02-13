// module.exports = {
//     babel: {
//         plugins: [
//             ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
//             ["@babel/plugin-proposal-class-properties"]
//         ]
//     },
//     push: true,
//     cache: true,
//     clean: false,
//     web_modules: {
//         ignored: ["jasmine-core"],
//         standalone: ["rxjs"],
//         terser: true
//     }
// };

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
    }
};
