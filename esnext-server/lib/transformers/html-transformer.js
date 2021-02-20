"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHtmlTransformer = void 0;
const esnext_web_modules_1 = require("esnext-web-modules");
const he_1 = require("he");
const htmlparser2_1 = require("htmlparser2");
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const connect_1 = require("../script/connect");
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
exports.useHtmlTransformer = pico_memoize_1.default(config => {
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
            links: [...imports]
        };
    }
    return {
        htmlTransformer
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBbUM7QUFDbkMsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQUNuQywrQ0FBc0Q7QUFDdEQsbURBQXFEO0FBQ3JELDJEQUF3RDtBQUszQyxRQUFBLGtCQUFrQixHQUFHLHNCQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7SUFFL0MsTUFBTSxFQUFDLGdCQUFnQixFQUFDLEdBQUcsdUNBQW1CLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sRUFBQyxhQUFhLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlDLFNBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPO1FBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNqQixJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSTtnQkFBRSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3ZELElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxXQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztpQkFDakQ7cUJBQU07b0JBQ0gsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7aUJBQ3RCO1lBQ0QsT0FBTyxJQUFJLEdBQUcsR0FBRyxDQUFDO1NBQ3JCO2FBQU07WUFDSCxPQUFPLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFD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QUssRUFBRTs0QkFDWixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ2pCO2dCQUNELE9BQU8sQ0FBQztvQkFDSixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ25CLE9BQU87aUJBQ1YsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztTQUVKLEVBQUU7WUFDQyxPQUFPLEVBQUUsS0FBSztZQUNkLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLG9CQUFvQixFQUFFLElBQUk7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFDMUQsTUFBTSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRSxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLDhCQUFpQjtnQkFDakMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxrQkFBa0I7YUFDdEM7WUFDRCxLQUFLLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUN0QixDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxlQUFlO0tBQ2xCLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xuaW1wb3J0IHtlc2NhcGV9IGZyb20gXCJoZVwiO1xuaW1wb3J0IHtQYXJzZXJ9IGZyb20gXCJodG1scGFyc2VyMlwiO1xuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcbmltcG9ydCB7ZXNuZXh0Q29ubmVjdFNjcmlwdH0gZnJvbSBcIi4uL3NjcmlwdC9jb25uZWN0XCI7XG5pbXBvcnQge0hUTUxfQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XG5pbXBvcnQge3VzZUJhYmVsVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2JhYmVsLXRyYW5zZm9ybWVyXCI7XG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xuXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1SZXN1bHQgPSB7IGh0bWw6IHN0cmluZywgaW1wb3J0czogU2V0PHN0cmluZz4gfTtcblxuZXhwb3J0IGNvbnN0IHVzZUh0bWxUcmFuc2Zvcm1lciA9IG1lbW9pemUoY29uZmlnID0+IHtcblxuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIoY29uZmlnLCBcImlubGluZVwiKTtcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKGNvbmZpZyk7XG5cbiAgICBmdW5jdGlvbiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpIHtcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnMpO1xuICAgICAgICBpZiAoa2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZXQgaHRtbCA9IFwiPFwiICsgbmFtZTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBrZXlzKSBpZiAoYXR0cmlicy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gYCAke25hbWV9PVwiJHtlc2NhcGUoYXR0cmlic1tuYW1lXSl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBodG1sICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBodG1sICsgXCI+XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCI8XCIgKyBuYW1lICsgXCI+XCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVRhZyhuYW1lKSB7XG4gICAgICAgIHJldHVybiBcIjwvXCIgKyBuYW1lICsgXCI+XCI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIFwiPFwiICsgZGF0YSArIFwiPlwiO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbW1lbnQodGV4dCkge1xuICAgICAgICByZXR1cm4gXCI8IS0tXCIgKyB0ZXh0ICsgXCItLT5cIjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1IdG1sQXN5bmMgPSBhc3luYyAoZmlsZW5hbWUsIGNvbnRlbnQpID0+IG5ldyBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgbGV0IHNjcmlwdENvdW50ID0gMDtcbiAgICAgICAgbGV0IHNjcmlwdENvbnRleHQ7XG4gICAgICAgIGxldCBodG1sOiAoc3RyaW5nIHwgUHJvbWlzZTxzdHJpbmc+KVtdID0gW107XG5cbiAgICAgICAgY29uc3QgZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XG4gICAgICAgIGNvbnN0IGJhc2VuYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlbmFtZSk7XG5cbiAgICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFBhcnNlcih7XG5cbiAgICAgICAgICAgIG9ucHJvY2Vzc2luZ2luc3RydWN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBodG1sLnB1c2gocHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9ub3BlbnRhZyhuYW1lLCBhdHRyaWJzKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiAhc2NyaXB0Q29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy50eXBlID09PSBcIm1vZHVsZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy5zcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVJbXBvcnQoYXR0cmlicy5zcmMsIGRpcm5hbWUpLnRoZW4ocmVsYXRpdmVVcmwgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0cy5hZGQocmVsYXRpdmVVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlicy5zcmMgPSByZWxhdGl2ZVVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChvcGVuVGFnKG5hbWUsIGF0dHJpYnMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3NjcmlwdENvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSBodG1sO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChvcGVuVGFnKG5hbWUsIGF0dHJpYnMpKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY2xvc2V0YWcobmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBcInNjcmlwdFwiICYmIHNjcmlwdENvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGh0bWwuam9pbihcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCA9IHNjcmlwdENvbnRleHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdG5hbWUgPSBmaWxlbmFtZSArIFwiIDxcIiArIHNjcmlwdENvdW50ICsgXCI+IFtzbV1cIjtcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFiZWxUcmFuc2Zvcm1lcihzY3JpcHRuYW1lLCB0ZXh0KS50aGVuKCh7Y29udGVudCwgbGlua3N9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBpbXBvcnRVcmwgb2YgbGlua3MhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKGltcG9ydFVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNsb3NlVGFnKG5hbWUpKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9udGV4dCh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25jb21tZW50KHRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoL1xcdyplc25leHQ6Y29ubmVjdFxcdyovLnRlc3QodGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKGVzbmV4dENvbm5lY3RTY3JpcHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChjb21tZW50KHRleHQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbmNkYXRhc3RhcnQoKSB7XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiPCFbQ0RBVEFbXCIpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25jZGF0YWVuZCgpIHtcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goXCJdXT5cIik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbmVycm9yKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKFwiZmFpbGVkIHRvIHRyYW5zZm9ybSBodG1sIGZpbGU6IFwiLCBmaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFzeW5jIG9uZW5kKCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGggPSAwOyBoIDwgaHRtbC5sZW5ndGg7IGgrKykgaWYgKHR5cGVvZiBodG1sW2hdICE9PSBcInN0cmluZ1wiKSB0cnkge1xuICAgICAgICAgICAgICAgICAgICBodG1sW2hdID0gYXdhaXQgaHRtbFtoXTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogaHRtbC5qb2luKFwiXCIpLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgeG1sTW9kZTogZmFsc2UsXG4gICAgICAgICAgICBkZWNvZGVFbnRpdGllczogdHJ1ZSxcbiAgICAgICAgICAgIHJlY29nbml6ZUNEQVRBOiB0cnVlLFxuICAgICAgICAgICAgcmVjb2duaXplU2VsZkNsb3Npbmc6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3RyZWFtLmVuZChjb250ZW50KTtcbiAgICB9KTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIGh0bWxUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xuICAgICAgICBjb25zdCB7aHRtbCwgaW1wb3J0c30gPSBhd2FpdCB0cmFuc2Zvcm1IdG1sQXN5bmMoZmlsZW5hbWUsIGNvbnRlbnQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGVudDogaHRtbCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBIVE1MX0NPTlRFTlRfVFlQRSxcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGh0bWwpLFxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImh0bWwtdHJhbnNmb3JtZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpbmtzOiBbLi4uaW1wb3J0c11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBodG1sVHJhbnNmb3JtZXJcbiAgICB9O1xufSk7XG4iXX0=