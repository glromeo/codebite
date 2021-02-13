import {readFileSync, writeFileSync} from "fs";
import {dirname} from "path";
import {ImportResolver} from "./index";

export async function replaceRequire(filename:string, resolveImport:ImportResolver) {

    let out = readFileSync(filename, "utf-8");
    let basedir = dirname(filename);

    let requires = new Set<string>();
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
        writeFileSync(filename, code);
    }
}