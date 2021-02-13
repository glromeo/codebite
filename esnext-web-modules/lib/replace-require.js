"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceRequire = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
async function replaceRequire(filename, resolveImport) {
    let out = fs_1.readFileSync(filename, "utf-8");
    let basedir = path_1.dirname(filename);
    let requires = new Set();
    let re = /require\s*\(([^)]+)\)/g;
    for (let match = re.exec(out); match; match = re.exec(out)) {
        let required = match[1].trim().slice(1, -1);
        requires.add(await resolveImport(required, basedir));
    }
    if (requires.size) {
        let r = 0;
        let cjsImports = ``;
        let cjsRequire = `function require(name) {\n  switch(name) {\n`;
        for (const url of requires) {
            cjsImports += `import require$${r} from "${url}";\n`;
            cjsRequire += `    case "${url}": return require$${r++};\n`;
        }
        cjsRequire += `  }\n}\n`;
        let code = cjsImports + cjsRequire + out;
        fs_1.writeFileSync(filename, code);
    }
}
exports.replaceRequire = replaceRequire;
//# sourceMappingURL=replace-require.js.map