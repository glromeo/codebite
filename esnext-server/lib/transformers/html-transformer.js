"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHtmlTransformer = void 0;
const esnext_web_modules_1 = require("esnext-web-modules");
const he_1 = require("he");
const htmlparser2_1 = require("htmlparser2");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const connect_1 = require("../script/connect");
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
exports.useHtmlTransformer = nano_memoize_1.default(config => {
    const { babelTransformer } = babel_transformer_1.useBabelTransformer(config, "inline");
    const { resolveImport } = esnext_web_modules_1.useWebModules(config);
    function openTag(name, attribs) {
        const keys = Object.keys(attribs);
        if (keys.length > 0) {
            let html = "<" + name;
            for (const name of keys)
                if (attribs.hasOwnProperty(name)) {
                    html += ` ${name}="${he_1.escape(attribs[name])}"`;
                }
                else {
                    html += " " + name;
                }
            return html + ">";
        }
        else {
            return "<" + name + ">";
        }
    }
    function closeTag(name) {
        return "</" + name + ">";
    }
    function processingInstruction(data) {
        return "<" + data + ">";
    }
    function comment(text) {
        return "<!--" + text + "-->";
    }
    const transformHtmlAsync = async (filename, content) => new Promise(async (resolve, reject) => {
        const imports = new Set();
        let scriptCount = 0;
        let scriptContext;
        let html = [];
        const dirname = path_1.default.dirname(filename);
        const basename = path_1.default.basename(filename);
        const stream = new htmlparser2_1.Parser({
            onprocessinginstruction(name, data) {
                html.push(processingInstruction(data));
            },
            onopentag(name, attribs) {
                if (name === "script" && !scriptContext) {
                    if (attribs.type === "module") {
                        if (attribs.src) {
                            html.push(resolveImport(attribs.src, dirname).then(relativeUrl => {
                                imports.add(relativeUrl);
                                attribs.src = relativeUrl;
                                return openTag(name, attribs);
                            }));
                        }
                        else {
                            html.push(openTag(name, attribs));
                            ++scriptCount;
                            scriptContext = html;
                            html = [];
                        }
                        return;
                    }
                }
                html.push(openTag(name, attribs));
            },
            onclosetag(name) {
                if (name === "script" && scriptContext) {
                    const text = html.join("");
                    html = scriptContext;
                    const scriptname = filename + " <" + scriptCount + "> [sm]";
                    html.push(babelTransformer(scriptname, text).then(({ content, links }) => {
                        for (const importUrl of links) {
                            imports.add(importUrl);
                        }
                        return content;
                    }));
                    scriptContext = undefined;
                }
                html.push(closeTag(name));
            },
            ontext(text) {
                html.push(text);
            },
            oncomment(text) {
                if (/\w*esnext:connect\w*/.test(text)) {
                    html.push(connect_1.esnextConnectScript);
                }
                else {
                    html.push(comment(text));
                }
            },
            oncdatastart() {
                html.push("<![CDATA[");
            },
            oncdataend() {
                html.push("]]>");
            },
            onerror(error) {
                tiny_node_logger_1.default.error("failed to transform html file: ", filename);
                reject(error);
            },
            async onend() {
                for (let h = 0; h < html.length; h++)
                    if (typeof html[h] !== "string")
                        try {
                            html[h] = await html[h];
                        }
                        catch (error) {
                            reject(error);
                        }
                resolve({
                    html: html.join(""),
                    imports
                });
            }
        }, {
            xmlMode: false,
            decodeEntities: true,
            recognizeCDATA: true,
            recognizeSelfClosing: true
        });
        stream.end(content);
    });
    async function htmlTransformer(filename, content) {
        const { html, imports } = await transformHtmlAsync(filename, content);
        return {
            content: html,
            headers: {
                "content-type": mime_types_1.HTML_CONTENT_TYPE,
                "content-length": Buffer.byteLength(html),
                "x-transformer": "html-transformer"
            },
            links: imports
        };
    }
    return {
        htmlTransformer
    };
});
//# sourceMappingURL=html-transformer.js.map