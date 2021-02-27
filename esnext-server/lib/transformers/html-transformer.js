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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBbUM7QUFFbkMsd0VBQW1DO0FBQ25DLCtDQUFzRDtBQUN0RCxtREFBcUQ7QUFDckQsMkRBQXdEO0FBSzNDLFFBQUEsa0JBQWtCLEdBQUcsc0JBQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUUvQyxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakUsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLGtDQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUMsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU87UUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7WUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJO2dCQUFFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLFdBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDO2lCQUNqRDtxQkFBTTtvQkFDSCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztpQkFDdEI7WUFDRCxPQUFPLElBQUksR0FBRyxHQUFHLENBQUM7U0FDckI7YUFBTTtZQUNILE9BQU8sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7U0FDM0I7SUFDTCxD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LENBQUMsQ0FBQztZQUNQLENBQUM7U0FFSixFQUFFO1lBQ0MsT0FBTyxFQUFFLEtBQUs7WUFDZCxjQUFjLEVBQUUsSUFBSTtZQUNwQixjQUFjLEVBQUUsSUFBSTtZQUNwQixvQkFBb0IsRUFBRSxJQUFJO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWUsRUFBRSxPQUFjO1FBQzFELE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSw4QkFBaUI7Z0JBQ2pDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsS0FBSyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcbmltcG9ydCB7ZXNjYXBlfSBmcm9tIFwiaGVcIjtcbmltcG9ydCB7UGFyc2VyfSBmcm9tIFwiaHRtbHBhcnNlcjJcIjtcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XG5pbXBvcnQge2VzbmV4dENvbm5lY3RTY3JpcHR9IGZyb20gXCIuLi9zY3JpcHQvY29ubmVjdFwiO1xuaW1wb3J0IHtIVE1MX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHt1c2VCYWJlbFRyYW5zZm9ybWVyfSBmcm9tIFwiLi9iYWJlbC10cmFuc2Zvcm1lclwiO1xuaW1wb3J0IHtUcmFuc2Zvcm1lck91dHB1dH0gZnJvbSBcIi4vaW5kZXhcIjtcblxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtUmVzdWx0ID0geyBodG1sOiBzdHJpbmcsIGltcG9ydHM6IFNldDxzdHJpbmc+IH07XG5cbmV4cG9ydCBjb25zdCB1c2VIdG1sVHJhbnNmb3JtZXIgPSBtZW1vaXplKGNvbmZpZyA9PiB7XG5cbiAgICBjb25zdCB7YmFiZWxUcmFuc2Zvcm1lcn0gPSB1c2VCYWJlbFRyYW5zZm9ybWVyKGNvbmZpZywgXCJpbmxpbmVcIik7XG4gICAgY29uc3Qge3Jlc29sdmVJbXBvcnR9ID0gdXNlV2ViTW9kdWxlcyhjb25maWcpO1xuXG4gICAgZnVuY3Rpb24gb3BlblRhZyhuYW1lLCBhdHRyaWJzKSB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJzKTtcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IGh0bWwgPSBcIjxcIiArIG5hbWU7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2Yga2V5cykgaWYgKGF0dHJpYnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9IGAgJHtuYW1lfT1cIiR7ZXNjYXBlKGF0dHJpYnNbbmFtZV0pfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaHRtbCArIFwiPlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiPFwiICsgbmFtZSArIFwiPlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VUYWcobmFtZSkge1xuICAgICAgICByZXR1cm4gXCI8L1wiICsgbmFtZSArIFwiPlwiO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NpbmdJbnN0cnVjdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBcIjxcIiArIGRhdGEgKyBcIj5cIjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21tZW50KHRleHQpIHtcbiAgICAgICAgcmV0dXJuIFwiPCEtLVwiICsgdGV4dCArIFwiLS0+XCI7XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNmb3JtSHRtbEFzeW5jID0gYXN5bmMgKGZpbGVuYW1lLCBjb250ZW50KSA9PiBuZXcgUHJvbWlzZTxUcmFuc2Zvcm1SZXN1bHQ+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGxldCBzY3JpcHRDb3VudCA9IDA7XG4gICAgICAgIGxldCBzY3JpcHRDb250ZXh0O1xuICAgICAgICBsZXQgaHRtbDogKHN0cmluZyB8IFByb21pc2U8c3RyaW5nPilbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBQYXJzZXIoe1xuXG4gICAgICAgICAgICBvbnByb2Nlc3NpbmdpbnN0cnVjdGlvbihuYW1lLCBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKHByb2Nlc3NpbmdJbnN0cnVjdGlvbihkYXRhKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbm9wZW50YWcobmFtZSwgYXR0cmlicykge1xuXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic2NyaXB0XCIgJiYgIXNjcmlwdENvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnMudHlwZSA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnMuc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlSW1wb3J0KGF0dHJpYnMuc3JjLCBmaWxlbmFtZSkudGhlbihyZWxhdGl2ZVVybCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChyZWxhdGl2ZVVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJzLnNyYyA9IHJlbGF0aXZlVXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wZW5UYWcobmFtZSwgYXR0cmlicyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKG9wZW5UYWcobmFtZSwgYXR0cmlicykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrc2NyaXB0Q291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29udGV4dCA9IGh0bWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKG9wZW5UYWcobmFtZSwgYXR0cmlicykpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25jbG9zZXRhZyhuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic2NyaXB0XCIgJiYgc2NyaXB0Q29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gaHRtbC5qb2luKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICBodG1sID0gc2NyaXB0Q29udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0bmFtZSA9IGZpbGVuYW1lICsgXCIgPFwiICsgc2NyaXB0Q291bnQgKyBcIj4gW3NtXVwiO1xuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWJlbFRyYW5zZm9ybWVyKHNjcmlwdG5hbWUsIHRleHQpLnRoZW4oKHtjb250ZW50LCBsaW5rc30pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGltcG9ydFVybCBvZiBsaW5rcyEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0cy5hZGQoaW1wb3J0VXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBodG1sLnB1c2goY2xvc2VUYWcobmFtZSkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb250ZXh0KHRleHQpIHtcbiAgICAgICAgICAgICAgICBodG1sLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbmNvbW1lbnQodGV4dCkge1xuICAgICAgICAgICAgICAgIGlmICgvXFx3KmVzbmV4dDpjb25uZWN0XFx3Ki8udGVzdCh0ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goZXNuZXh0Q29ubmVjdFNjcmlwdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKGNvbW1lbnQodGV4dCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY2RhdGFzdGFydCgpIHtcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goXCI8IVtDREFUQVtcIik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbmNkYXRhZW5kKCkge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIl1dPlwiKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoXCJmYWlsZWQgdG8gdHJhbnNmb3JtIGh0bWwgZmlsZTogXCIsIGZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXN5bmMgb25lbmQoKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCBodG1sLmxlbmd0aDsgaCsrKSBpZiAodHlwZW9mIGh0bWxbaF0gIT09IFwic3RyaW5nXCIpIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWxbaF0gPSBhd2FpdCBodG1sW2hdO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBodG1sOiBodG1sLmpvaW4oXCJcIiksXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydHNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LCB7XG4gICAgICAgICAgICB4bWxNb2RlOiBmYWxzZSxcbiAgICAgICAgICAgIGRlY29kZUVudGl0aWVzOiB0cnVlLFxuICAgICAgICAgICAgcmVjb2duaXplQ0RBVEE6IHRydWUsXG4gICAgICAgICAgICByZWNvZ25pemVTZWxmQ2xvc2luZzogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBzdHJlYW0uZW5kKGNvbnRlbnQpO1xuICAgIH0pO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gaHRtbFRyYW5zZm9ybWVyKGZpbGVuYW1lOnN0cmluZywgY29udGVudDpzdHJpbmcpOiBQcm9taXNlPFRyYW5zZm9ybWVyT3V0cHV0PiB7XG4gICAgICAgIGNvbnN0IHtodG1sLCBpbXBvcnRzfSA9IGF3YWl0IHRyYW5zZm9ybUh0bWxBc3luYyhmaWxlbmFtZSwgY29udGVudCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250ZW50OiBodG1sLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEhUTUxfQ09OVEVOVF9UWVBFLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogQnVmZmVyLmJ5dGVMZW5ndGgoaHRtbCksXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiaHRtbC10cmFuc2Zvcm1lclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGlua3M6IFsuLi5pbXBvcnRzXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGh0bWxUcmFuc2Zvcm1lclxuICAgIH07XG59KTtcbiJdfQ==