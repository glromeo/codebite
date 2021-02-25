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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBbUM7QUFFbkMsd0VBQW1DO0FBQ25DLCtDQUFzRDtBQUN0RCxtREFBcUQ7QUFDckQsMkRBQXdEO0FBSzNDLFFBQUEsa0JBQWtCLEdBQUcsc0JBQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUUvQyxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakUsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLGtDQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUMsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU87UUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7WUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJO2dCQUFFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLFdBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDO2lCQUNqRDtxQkFBTTtvQkFDSCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztpQkFDdEI7WUFDRCxPQUFPLElBQUksR0FBRyxHQUFHLENBQUM7U0FDckI7YUFBTTtZQUNILE9BQU8sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7U0FDM0I7SUFDTCxD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LENBQUMsQ0FBQztZQUNQLENBQUM7U0FFSixFQUFFO1lBQ0MsT0FBTyxFQUFFLEtBQUs7WUFDZCxjQUFjLEVBQUUsSUFBSTtZQUNwQixjQUFjLEVBQUUsSUFBSTtZQUNwQixvQkFBb0IsRUFBRSxJQUFJO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWUsRUFBRSxPQUFjO1FBQzFELE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSw4QkFBaUI7Z0JBQ2pDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsS0FBSyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IHtlc2NhcGV9IGZyb20gXCJoZVwiO1xyXG5pbXBvcnQge1BhcnNlcn0gZnJvbSBcImh0bWxwYXJzZXIyXCI7XHJcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge2VzbmV4dENvbm5lY3RTY3JpcHR9IGZyb20gXCIuLi9zY3JpcHQvY29ubmVjdFwiO1xyXG5pbXBvcnQge0hUTUxfQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcbmltcG9ydCB7dXNlQmFiZWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vYmFiZWwtdHJhbnNmb3JtZXJcIjtcclxuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFRyYW5zZm9ybVJlc3VsdCA9IHsgaHRtbDogc3RyaW5nLCBpbXBvcnRzOiBTZXQ8c3RyaW5nPiB9O1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUh0bWxUcmFuc2Zvcm1lciA9IG1lbW9pemUoY29uZmlnID0+IHtcclxuXHJcbiAgICBjb25zdCB7YmFiZWxUcmFuc2Zvcm1lcn0gPSB1c2VCYWJlbFRyYW5zZm9ybWVyKGNvbmZpZywgXCJpbmxpbmVcIik7XHJcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKGNvbmZpZyk7XHJcblxyXG4gICAgZnVuY3Rpb24gb3BlblRhZyhuYW1lLCBhdHRyaWJzKSB7XHJcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnMpO1xyXG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGh0bWwgPSBcIjxcIiArIG5hbWU7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBrZXlzKSBpZiAoYXR0cmlicy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgaHRtbCArPSBgICR7bmFtZX09XCIke2VzY2FwZShhdHRyaWJzW25hbWVdKX1cImA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9IFwiIFwiICsgbmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaHRtbCArIFwiPlwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIjxcIiArIG5hbWUgKyBcIj5cIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xvc2VUYWcobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBcIjwvXCIgKyBuYW1lICsgXCI+XCI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpIHtcclxuICAgICAgICByZXR1cm4gXCI8XCIgKyBkYXRhICsgXCI+XCI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29tbWVudCh0ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIFwiPCEtLVwiICsgdGV4dCArIFwiLS0+XCI7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdHJhbnNmb3JtSHRtbEFzeW5jID0gYXN5bmMgKGZpbGVuYW1lLCBjb250ZW50KSA9PiBuZXcgUHJvbWlzZTxUcmFuc2Zvcm1SZXN1bHQ+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgaW1wb3J0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgIGxldCBzY3JpcHRDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IHNjcmlwdENvbnRleHQ7XHJcbiAgICAgICAgbGV0IGh0bWw6IChzdHJpbmcgfCBQcm9taXNlPHN0cmluZz4pW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFBhcnNlcih7XHJcblxyXG4gICAgICAgICAgICBvbnByb2Nlc3NpbmdpbnN0cnVjdGlvbihuYW1lLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2gocHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9ub3BlbnRhZyhuYW1lLCBhdHRyaWJzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic2NyaXB0XCIgJiYgIXNjcmlwdENvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy50eXBlID09PSBcIm1vZHVsZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRyaWJzLnNyYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVJbXBvcnQoYXR0cmlicy5zcmMsIGZpbGVuYW1lKS50aGVuKHJlbGF0aXZlVXJsID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0cy5hZGQocmVsYXRpdmVVcmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJzLnNyYyA9IHJlbGF0aXZlVXJsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlblRhZyhuYW1lLCBhdHRyaWJzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChvcGVuVGFnKG5hbWUsIGF0dHJpYnMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrc2NyaXB0Q291bnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gaHRtbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChvcGVuVGFnKG5hbWUsIGF0dHJpYnMpKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uY2xvc2V0YWcobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic2NyaXB0XCIgJiYgc2NyaXB0Q29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBodG1sLmpvaW4oXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbCA9IHNjcmlwdENvbnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0bmFtZSA9IGZpbGVuYW1lICsgXCIgPFwiICsgc2NyaXB0Q291bnQgKyBcIj4gW3NtXVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFiZWxUcmFuc2Zvcm1lcihzY3JpcHRuYW1lLCB0ZXh0KS50aGVuKCh7Y29udGVudCwgbGlua3N9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGltcG9ydFVybCBvZiBsaW5rcyEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChpbXBvcnRVcmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNsb3NlVGFnKG5hbWUpKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9udGV4dCh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2godGV4dCk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNvbW1lbnQodGV4dCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKC9cXHcqZXNuZXh0OmNvbm5lY3RcXHcqLy50ZXN0KHRleHQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKGVzbmV4dENvbm5lY3RTY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goY29tbWVudCh0ZXh0KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNkYXRhc3RhcnQoKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goXCI8IVtDREFUQVtcIik7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmNkYXRhZW5kKCkge1xyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiXV0+XCIpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25lcnJvcihlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKFwiZmFpbGVkIHRvIHRyYW5zZm9ybSBodG1sIGZpbGU6IFwiLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgYXN5bmMgb25lbmQoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gMDsgaCA8IGh0bWwubGVuZ3RoOyBoKyspIGlmICh0eXBlb2YgaHRtbFtoXSAhPT0gXCJzdHJpbmdcIikgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sW2hdID0gYXdhaXQgaHRtbFtoXTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWw6IGh0bWwuam9pbihcIlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIHhtbE1vZGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBkZWNvZGVFbnRpdGllczogdHJ1ZSxcclxuICAgICAgICAgICAgcmVjb2duaXplQ0RBVEE6IHRydWUsXHJcbiAgICAgICAgICAgIHJlY29nbml6ZVNlbGZDbG9zaW5nOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHN0cmVhbS5lbmQoY29udGVudCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBodG1sVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcclxuICAgICAgICBjb25zdCB7aHRtbCwgaW1wb3J0c30gPSBhd2FpdCB0cmFuc2Zvcm1IdG1sQXN5bmMoZmlsZW5hbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGh0bWwsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEhUTUxfQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChodG1sKSxcclxuICAgICAgICAgICAgICAgIFwieC10cmFuc2Zvcm1lclwiOiBcImh0bWwtdHJhbnNmb3JtZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsaW5rczogWy4uLmltcG9ydHNdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGh0bWxUcmFuc2Zvcm1lclxyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==