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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBbUM7QUFDbkMsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQUNuQywrQ0FBc0Q7QUFDdEQsbURBQXFEO0FBQ3JELDJEQUF3RDtBQUszQyxRQUFBLGtCQUFrQixHQUFHLHNCQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7SUFFL0MsTUFBTSxFQUFDLGdCQUFnQixFQUFDLEdBQUcsdUNBQW1CLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sRUFBQyxhQUFhLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlDLFNBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPO1FBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNqQixJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSTtnQkFBRSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3ZELElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxXQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztpQkFDakQ7cUJBQU07b0JBQ0gsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7aUJBQ3RCO1lBQ0QsT0FBTyxJQUFJLEdBQUcsR0FBRyxDQUFDO1NBQ3JCO2FBQU07WUFDSCxPQUFPLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO1NBQzNCO0lBQ0wsQ0FBQztJQUVELFNBQVMsUUFBUSxDQUFDLElBQUk7UUFDbEIsT0FBTyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFJO1FBQy9CLE9BQU8sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7SUFDNUIsQ0FBQztJQUVELFNBQVMsT0FBTyxDQUFDLElBQUk7UUFDakIsT0FBTyxNQUFNLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNqQyxDQUFDO0lBRUQsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxPQUFPLENBQWtCLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFFM0csTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNsQyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxhQUFhLENBQUM7UUFDbEIsSUFBSSxJQUFJLEdBQWlDLEVBQUUsQ0FBQztRQUU1QyxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBTSxDQUFDO1lBRXRCLHVCQUF1QixDQUFDLElBQUksRUFBRSxJQUFJO2dCQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTztnQkFFbkIsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsYUFBYSxFQUFFO29CQUNyQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO3dCQUMzQixJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7NEJBQ2IsSUFBSSxDQUFDLElBQUksQ0FDTCxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0NBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7Z0NBQ3pCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUFDO2dDQUMxQixPQUFPLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ2xDLENBQUMsQ0FBQyxDQUNMLENBQUM7eUJBQ0w7NkJBQU07NEJBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ2xDLEVBQUUsV0FBVyxDQUFDOzRCQUNkLGFBQWEsR0FBRyxJQUFJLENBQUM7NEJBQ3JCLElBQUksR0FBRyxFQUFFLENBQUM7eUJBQ2I7d0JBQ0QsT0FBTztxQkFDVjtpQkFDSjtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsVUFBVSxDQUFDLElBQUk7Z0JBQ1gsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLGFBQWEsRUFBRTtvQkFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDM0IsSUFBSSxHQUFHLGFBQWEsQ0FBQztvQkFDckIsTUFBTSxVQUFVLEdBQUcsUUFBUSxHQUFHLElBQUksR0FBRyxXQUFXLEdBQUcsUUFBUSxDQUFDO29CQUM1RCxJQUFJLENBQUMsSUFBSSxDQUNMLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsRUFBRSxFQUFFO3dCQUN6RCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQU0sRUFBRTs0QkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQzt5QkFDMUI7d0JBQ0QsT0FBTyxPQUFPLENBQUM7b0JBQ25CLENBQUMsQ0FBQyxDQUNMLENBQUM7b0JBQ0YsYUFBYSxHQUFHLFNBQVMsQ0FBQztpQkFDN0I7Z0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUk7Z0JBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBRUQsU0FBUyxDQUFDLElBQUk7Z0JBQ1YsSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQW1CLENBQUMsQ0FBQztpQkFDbEM7cUJBQU07b0JBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDNUI7WUFDTCxDQUFDO1lBRUQsWUFBWTtnQkFDUixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxVQUFVO2dCQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sQ0FBQyxLQUFLO2dCQUNULDBCQUFHLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUVELEtBQUssQ0FBQyxLQUFLO2dCQUNQLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtvQkFBRSxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVE7d0JBQUUsSUFBSTs0QkFDdkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUMzQjt3QkFBQyxPQUFPLEtBQUssRUFBRTs0QkFDWixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ2pCO2dCQUNELE9BQU8sQ0FBQztvQkFDSixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ25CLE9BQU87aUJBQ1YsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztTQUVKLEVBQUU7WUFDQyxPQUFPLEVBQUUsS0FBSztZQUNkLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLG9CQUFvQixFQUFFLElBQUk7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssVUFBVSxlQUFlLENBQUMsUUFBZSxFQUFFLE9BQWM7UUFDMUQsTUFBTSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRSxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLDhCQUFpQjtnQkFDakMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLGVBQWUsRUFBRSxrQkFBa0I7YUFDdEM7WUFDRCxLQUFLLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUN0QixDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU87UUFDSCxlQUFlO0tBQ2xCLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQge2VzY2FwZX0gZnJvbSBcImhlXCI7XHJcbmltcG9ydCB7UGFyc2VyfSBmcm9tIFwiaHRtbHBhcnNlcjJcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB7ZXNuZXh0Q29ubmVjdFNjcmlwdH0gZnJvbSBcIi4uL3NjcmlwdC9jb25uZWN0XCI7XHJcbmltcG9ydCB7SFRNTF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHt1c2VCYWJlbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9iYWJlbC10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQge1RyYW5zZm9ybWVyT3V0cHV0fSBmcm9tIFwiLi9pbmRleFwiO1xyXG5cclxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtUmVzdWx0ID0geyBodG1sOiBzdHJpbmcsIGltcG9ydHM6IFNldDxzdHJpbmc+IH07XHJcblxyXG5leHBvcnQgY29uc3QgdXNlSHRtbFRyYW5zZm9ybWVyID0gbWVtb2l6ZShjb25maWcgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIoY29uZmlnLCBcImlubGluZVwiKTtcclxuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0fSA9IHVzZVdlYk1vZHVsZXMoY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpIHtcclxuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXR0cmlicyk7XHJcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgaHRtbCA9IFwiPFwiICsgbmFtZTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGtleXMpIGlmIChhdHRyaWJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9IGAgJHtuYW1lfT1cIiR7ZXNjYXBlKGF0dHJpYnNbbmFtZV0pfVwiYDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gXCIgXCIgKyBuYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBodG1sICsgXCI+XCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiPFwiICsgbmFtZSArIFwiPlwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9zZVRhZyhuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiPC9cIiArIG5hbWUgKyBcIj5cIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBcIjxcIiArIGRhdGEgKyBcIj5cIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjb21tZW50KHRleHQpIHtcclxuICAgICAgICByZXR1cm4gXCI8IS0tXCIgKyB0ZXh0ICsgXCItLT5cIjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1IdG1sQXN5bmMgPSBhc3luYyAoZmlsZW5hbWUsIGNvbnRlbnQpID0+IG5ldyBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgbGV0IHNjcmlwdENvdW50ID0gMDtcclxuICAgICAgICBsZXQgc2NyaXB0Q29udGV4dDtcclxuICAgICAgICBsZXQgaHRtbDogKHN0cmluZyB8IFByb21pc2U8c3RyaW5nPilbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVuYW1lKTtcclxuICAgICAgICBjb25zdCBiYXNlbmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZW5hbWUpO1xyXG5cclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBuZXcgUGFyc2VyKHtcclxuXHJcbiAgICAgICAgICAgIG9ucHJvY2Vzc2luZ2luc3RydWN0aW9uKG5hbWUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25vcGVudGFnKG5hbWUsIGF0dHJpYnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiAhc2NyaXB0Q29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRyaWJzLnR5cGUgPT09IFwibW9kdWxlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnMuc3JjKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUltcG9ydChhdHRyaWJzLnNyYywgZGlybmFtZSkudGhlbihyZWxhdGl2ZVVybCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKHJlbGF0aXZlVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlicy5zcmMgPSByZWxhdGl2ZVVybDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wZW5UYWcobmFtZSwgYXR0cmlicyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK3NjcmlwdENvdW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29udGV4dCA9IGh0bWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNsb3NldGFnKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBcInNjcmlwdFwiICYmIHNjcmlwdENvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gaHRtbC5qb2luKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgPSBzY3JpcHRDb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdG5hbWUgPSBmaWxlbmFtZSArIFwiIDxcIiArIHNjcmlwdENvdW50ICsgXCI+IFtzbV1cIjtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVsVHJhbnNmb3JtZXIoc2NyaXB0bmFtZSwgdGV4dCkudGhlbigoe2NvbnRlbnQsIGxpbmtzfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBpbXBvcnRVcmwgb2YgbGlua3MhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0cy5hZGQoaW1wb3J0VXJsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29udGV4dCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChjbG9zZVRhZyhuYW1lKSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbnRleHQodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHRleHQpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jb21tZW50KHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGlmICgvXFx3KmVzbmV4dDpjb25uZWN0XFx3Ki8udGVzdCh0ZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChlc25leHRDb25uZWN0U2NyaXB0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNvbW1lbnQodGV4dCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jZGF0YXN0YXJ0KCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiPCFbQ0RBVEFbXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jZGF0YWVuZCgpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIl1dPlwiKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uZXJyb3IoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihcImZhaWxlZCB0byB0cmFuc2Zvcm0gaHRtbCBmaWxlOiBcIiwgZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGFzeW5jIG9uZW5kKCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCBodG1sLmxlbmd0aDsgaCsrKSBpZiAodHlwZW9mIGh0bWxbaF0gIT09IFwic3RyaW5nXCIpIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbFtoXSA9IGF3YWl0IGh0bWxbaF07XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sOiBodG1sLmpvaW4oXCJcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0c1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB4bWxNb2RlOiBmYWxzZSxcclxuICAgICAgICAgICAgZGVjb2RlRW50aXRpZXM6IHRydWUsXHJcbiAgICAgICAgICAgIHJlY29nbml6ZUNEQVRBOiB0cnVlLFxyXG4gICAgICAgICAgICByZWNvZ25pemVTZWxmQ2xvc2luZzogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzdHJlYW0uZW5kKGNvbnRlbnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XHJcbiAgICAgICAgY29uc3Qge2h0bWwsIGltcG9ydHN9ID0gYXdhaXQgdHJhbnNmb3JtSHRtbEFzeW5jKGZpbGVuYW1lLCBjb250ZW50KTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb250ZW50OiBodG1sLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBIVE1MX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoaHRtbCksXHJcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJodG1sLXRyYW5zZm9ybWVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGlua3M6IFsuLi5pbXBvcnRzXVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBodG1sVHJhbnNmb3JtZXJcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=