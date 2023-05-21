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
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const connect_1 = require("../script/connect");
const mime_types_1 = require("../util/mime-types");
const babel_transformer_1 = require("./babel-transformer");
exports.useHtmlTransformer = (0, nano_memoize_1.default)(config => {
    const { babelTransformer } = (0, babel_transformer_1.useBabelTransformer)(config, "inline");
    const { resolveImport } = (0, esnext_web_modules_1.useWebModules)(config);
    function openTag(name, attribs) {
        const keys = Object.keys(attribs);
        if (keys.length > 0) {
            let html = "<" + name;
            for (const name of keys)
                if (attribs.hasOwnProperty(name)) {
                    html += ` ${name}="${(0, he_1.escape)(attribs[name])}"`;
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
        const stream = new htmlparser2_1.Parser({
            onprocessinginstruction(name, data) {
                html.push(processingInstruction(data));
            },
            onopentag(name, attribs) {
                if (name === "script" && !scriptContext) {
                    if (attribs.type === "module") {
                        if (attribs.src) {
                            html.push(resolveImport(attribs.src, filename).then(relativeUrl => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBb0M7QUFFcEMsd0VBQW1DO0FBQ25DLCtDQUFzRDtBQUN0RCxtREFBcUQ7QUFDckQsMkRBQXdEO0FBSzNDLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSxzQkFBUSxFQUFDLE1BQU0sQ0FBQyxFQUFFO0lBRWhELE1BQU0sRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLElBQUEsdUNBQW1CLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sRUFBQyxhQUFhLEVBQUMsR0FBRyxJQUFBLGtDQUFhLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUMsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU87UUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7WUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJO2dCQUFFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLElBQUEsV0FBTSxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7aUJBQ2pEO3FCQUFNO29CQUNILElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO2lCQUN0QjtZQUNELE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUNyQjthQUFNO1lBQ0gsT0FBTyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUMzQjtJQUNMLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFJO1FBQ2xCLE9BQU8sSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7SUFDN0IsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUMsSUFBSTtRQUMvQixPQUFPLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO0lBQzVCLENBQUM7SUFFRCxTQUFTLE9BQU8sQ0FBQyxJQUFJO1FBQ2pCLE9BQU8sTUFBTSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7SUFDakMsQ0FBQztJQUVELE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFrQixLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBRTNHLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDbEMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksYUFBYSxDQUFDO1FBQ2xCLElBQUksSUFBSSxHQUFpQyxFQUFFLENBQUM7UUFFNUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBTSxDQUFDO1lBRXRCLHVCQUF1QixDQUFDLElBQUksRUFBRSxJQUFJO2dCQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTztnQkFFbkIsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsYUFBYSxFQUFFO29CQUNyQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO3dCQUMzQixJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7NEJBQ2IsSUFBSSxDQUFDLElBQUksQ0FDTCxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0NBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7Z0NBQ3pCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUFDO2dDQUMxQixPQUFPLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ2xDLENBQUMsQ0FBQyxDQUNMLENBQUM7eUJBQ0w7NkJBQU07NEJBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ2xDLEVBQUUsV0FBVyxDQUFDOzRCQUNkLGFBQWEsR0FBRyxJQUFJLENBQUM7NEJBQ3JCLElBQUksR0FBRyxFQUFFLENBQUM7eUJBQ2I7d0JBQ0QsT0FBTztxQkFDVjtpQkFDSjtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsVUFBVSxDQUFDLElBQUk7Z0JBQ1gsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLGFBQWEsRUFBRTtvQkFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDM0IsSUFBSSxHQUFHLGFBQWEsQ0FBQztvQkFDckIsTUFBTSxVQUFVLEdBQUcsUUFBUSxHQUFHLElBQUksR0FBRyxXQUFXLEdBQUcsUUFBUSxDQUFDO29CQUM1RCxJQUFJLENBQUMsSUFBSSxDQUNMLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsRUFBRSxFQUFFO3dCQUN6RCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQU0sRUFBRTs0QkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQzt5QkFDMUI7d0JBQ0QsT0FBTyxPQUFPLENBQUM7b0JBQ25CLENBQUMsQ0FBQyxDQUNMLENBQUM7b0JBQ0YsYUFBYSxHQUFHLFNBQVMsQ0FBQztpQkFDN0I7Z0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUk7Z0JBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBRUQsU0FBUyxDQUFDLElBQUk7Z0JBQ1YsSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQW1CLENBQUMsQ0FBQztpQkFDbEM7cUJBQU07b0JBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDNUI7WUFDTCxDQUFDO1lBRUQsWUFBWTtnQkFDUixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxVQUFVO2dCQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sQ0FBQyxLQUFLO2dCQUNULDBCQUFHLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUVELEtBQUssQ0FBQyxLQUFLO2dCQUNQLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtvQkFBRSxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVE7d0JBQUUsSUFBSTs0QkFDdkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUMzQjt3QkFBQyxPQUFPLEtBQUssRUFBRTs0QkFDWixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ2pCO2dCQUNELE9BQU8sQ0FBQztvQkFDSixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ25CLE9BQU87aUJBQ1YsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztTQUVKLEVBQUU7WUFDQyxPQUFPLEVBQUUsS0FBSztZQUNkLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLG9CQUFvQixFQUFFLElBQUk7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFDMUQsTUFBTSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRSxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLDhCQUFpQjtnQkFDakMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxrQkFBa0I7YUFDdEM7WUFDRCxLQUFLLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUN0QixDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxlQUFlO0tBQ2xCLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQge2VzY2FwZX0gZnJvbSBcImhlXCI7XHJcbmltcG9ydCB7UGFyc2VyfSBmcm9tIFwiaHRtbHBhcnNlcjJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge2VzbmV4dENvbm5lY3RTY3JpcHR9IGZyb20gXCIuLi9zY3JpcHQvY29ubmVjdFwiO1xyXG5pbXBvcnQge0hUTUxfQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcbmltcG9ydCB7dXNlQmFiZWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vYmFiZWwtdHJhbnNmb3JtZXJcIjtcclxuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFRyYW5zZm9ybVJlc3VsdCA9IHsgaHRtbDogc3RyaW5nLCBpbXBvcnRzOiBTZXQ8c3RyaW5nPiB9O1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUh0bWxUcmFuc2Zvcm1lciA9IG1lbW9pemVkKGNvbmZpZyA9PiB7XHJcblxyXG4gICAgY29uc3Qge2JhYmVsVHJhbnNmb3JtZXJ9ID0gdXNlQmFiZWxUcmFuc2Zvcm1lcihjb25maWcsIFwiaW5saW5lXCIpO1xyXG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnR9ID0gdXNlV2ViTW9kdWxlcyhjb25maWcpO1xyXG5cclxuICAgIGZ1bmN0aW9uIG9wZW5UYWcobmFtZSwgYXR0cmlicykge1xyXG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJzKTtcclxuICAgICAgICBpZiAoa2V5cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBodG1sID0gXCI8XCIgKyBuYW1lO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2Yga2V5cykgaWYgKGF0dHJpYnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gYCAke25hbWV9PVwiJHtlc2NhcGUoYXR0cmlic1tuYW1lXSl9XCJgO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaHRtbCArPSBcIiBcIiArIG5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGh0bWwgKyBcIj5cIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gXCI8XCIgKyBuYW1lICsgXCI+XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNsb3NlVGFnKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gXCI8L1wiICsgbmFtZSArIFwiPlwiO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHByb2Nlc3NpbmdJbnN0cnVjdGlvbihkYXRhKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiPFwiICsgZGF0YSArIFwiPlwiO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNvbW1lbnQodGV4dCkge1xyXG4gICAgICAgIHJldHVybiBcIjwhLS1cIiArIHRleHQgKyBcIi0tPlwiO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybUh0bWxBc3luYyA9IGFzeW5jIChmaWxlbmFtZSwgY29udGVudCkgPT4gbmV3IFByb21pc2U8VHJhbnNmb3JtUmVzdWx0Pihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICBsZXQgc2NyaXB0Q291bnQgPSAwO1xyXG4gICAgICAgIGxldCBzY3JpcHRDb250ZXh0O1xyXG4gICAgICAgIGxldCBodG1sOiAoc3RyaW5nIHwgUHJvbWlzZTxzdHJpbmc+KVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBQYXJzZXIoe1xyXG5cclxuICAgICAgICAgICAgb25wcm9jZXNzaW5naW5zdHJ1Y3Rpb24obmFtZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHByb2Nlc3NpbmdJbnN0cnVjdGlvbihkYXRhKSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbm9wZW50YWcobmFtZSwgYXR0cmlicykge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBcInNjcmlwdFwiICYmICFzY3JpcHRDb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnMudHlwZSA9PT0gXCJtb2R1bGVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy5zcmMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlSW1wb3J0KGF0dHJpYnMuc3JjLCBmaWxlbmFtZSkudGhlbihyZWxhdGl2ZVVybCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKHJlbGF0aXZlVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlicy5zcmMgPSByZWxhdGl2ZVVybDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wZW5UYWcobmFtZSwgYXR0cmlicyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3NjcmlwdENvdW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29udGV4dCA9IGh0bWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNsb3NldGFnKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBcInNjcmlwdFwiICYmIHNjcmlwdENvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gaHRtbC5qb2luKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgPSBzY3JpcHRDb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdG5hbWUgPSBmaWxlbmFtZSArIFwiIDxcIiArIHNjcmlwdENvdW50ICsgXCI+IFtzbV1cIjtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVsVHJhbnNmb3JtZXIoc2NyaXB0bmFtZSwgdGV4dCkudGhlbigoe2NvbnRlbnQsIGxpbmtzfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBpbXBvcnRVcmwgb2YgbGlua3MhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0cy5hZGQoaW1wb3J0VXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29udGV4dCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChjbG9zZVRhZyhuYW1lKSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbnRleHQodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHRleHQpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jb21tZW50KHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGlmICgvXFx3KmVzbmV4dDpjb25uZWN0XFx3Ki8udGVzdCh0ZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChlc25leHRDb25uZWN0U2NyaXB0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNvbW1lbnQodGV4dCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jZGF0YXN0YXJ0KCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiPCFbQ0RBVEFbXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jZGF0YWVuZCgpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIl1dPlwiKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uZXJyb3IoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihcImZhaWxlZCB0byB0cmFuc2Zvcm0gaHRtbCBmaWxlOiBcIiwgZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGFzeW5jIG9uZW5kKCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCBodG1sLmxlbmd0aDsgaCsrKSBpZiAodHlwZW9mIGh0bWxbaF0gIT09IFwic3RyaW5nXCIpIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbFtoXSA9IGF3YWl0IGh0bWxbaF07XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sOiBodG1sLmpvaW4oXCJcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0c1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB4bWxNb2RlOiBmYWxzZSxcclxuICAgICAgICAgICAgZGVjb2RlRW50aXRpZXM6IHRydWUsXHJcbiAgICAgICAgICAgIHJlY29nbml6ZUNEQVRBOiB0cnVlLFxyXG4gICAgICAgICAgICByZWNvZ25pemVTZWxmQ2xvc2luZzogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0uZW5kKGNvbnRlbnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcbiAgICAgICAgY29uc3Qge2h0bWwsIGltcG9ydHN9ID0gYXdhaXQgdHJhbnNmb3JtSHRtbEFzeW5jKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBodG1sLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBIVE1MX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoaHRtbCksXHJcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJodG1sLXRyYW5zZm9ybWVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGlua3M6IFsuLi5pbXBvcnRzXVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBodG1sVHJhbnNmb3JtZXJcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=