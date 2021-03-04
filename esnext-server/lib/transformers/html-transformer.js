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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBb0M7QUFFcEMsd0VBQW1DO0FBQ25DLCtDQUFzRDtBQUN0RCxtREFBcUQ7QUFDckQsMkRBQXdEO0FBSzNDLFFBQUEsa0JBQWtCLEdBQUcsc0JBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUVoRCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakUsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLGtDQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUMsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU87UUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7WUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJO2dCQUFFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLFdBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDO2lCQUNqRDtxQkFBTTtvQkFDSCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztpQkFDdEI7WUFDRCxPQUFPLElBQUksR0FBRyxHQUFHLENBQUM7U0FDckI7YUFBTTtZQUNILE9BQU8sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7U0FDM0I7SUFDTCxD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LENBQUMsQ0FBQztZQUNQLENBQUM7U0FFSixFQUFFO1lBQ0MsT0FBTyxFQUFFLEtBQUs7WUFDZCxjQUFjLEVBQUUsSUFBSTtZQUNwQixjQUFjLEVBQUUsSUFBSTtZQUNwQixvQkFBb0IsRUFBRSxJQUFJO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWUsRUFBRSxPQUFjO1FBQzFELE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSw4QkFBaUI7Z0JBQ2pDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsS0FBSyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IHtlc2NhcGV9IGZyb20gXCJoZVwiO1xyXG5pbXBvcnQge1BhcnNlcn0gZnJvbSBcImh0bWxwYXJzZXIyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtlc25leHRDb25uZWN0U2NyaXB0fSBmcm9tIFwiLi4vc2NyaXB0L2Nvbm5lY3RcIjtcclxuaW1wb3J0IHtIVE1MX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZUJhYmVsVHJhbnNmb3JtZXJ9IGZyb20gXCIuL2JhYmVsLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7VHJhbnNmb3JtZXJPdXRwdXR9IGZyb20gXCIuL2luZGV4XCI7XHJcblxyXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1SZXN1bHQgPSB7IGh0bWw6IHN0cmluZywgaW1wb3J0czogU2V0PHN0cmluZz4gfTtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VIdG1sVHJhbnNmb3JtZXIgPSBtZW1vaXplZChjb25maWcgPT4ge1xyXG5cclxuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIoY29uZmlnLCBcImlubGluZVwiKTtcclxuICAgIGNvbnN0IHtyZXNvbHZlSW1wb3J0fSA9IHVzZVdlYk1vZHVsZXMoY29uZmlnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpIHtcclxuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXR0cmlicyk7XHJcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgaHRtbCA9IFwiPFwiICsgbmFtZTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGtleXMpIGlmIChhdHRyaWJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9IGAgJHtuYW1lfT1cIiR7ZXNjYXBlKGF0dHJpYnNbbmFtZV0pfVwiYDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gXCIgXCIgKyBuYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBodG1sICsgXCI+XCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiPFwiICsgbmFtZSArIFwiPlwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9zZVRhZyhuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiPC9cIiArIG5hbWUgKyBcIj5cIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBcIjxcIiArIGRhdGEgKyBcIj5cIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjb21tZW50KHRleHQpIHtcclxuICAgICAgICByZXR1cm4gXCI8IS0tXCIgKyB0ZXh0ICsgXCItLT5cIjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1IdG1sQXN5bmMgPSBhc3luYyAoZmlsZW5hbWUsIGNvbnRlbnQpID0+IG5ldyBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgbGV0IHNjcmlwdENvdW50ID0gMDtcclxuICAgICAgICBsZXQgc2NyaXB0Q29udGV4dDtcclxuICAgICAgICBsZXQgaHRtbDogKHN0cmluZyB8IFByb21pc2U8c3RyaW5nPilbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBuZXcgUGFyc2VyKHtcclxuXHJcbiAgICAgICAgICAgIG9ucHJvY2Vzc2luZ2luc3RydWN0aW9uKG5hbWUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oZGF0YSkpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25vcGVudGFnKG5hbWUsIGF0dHJpYnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiAhc2NyaXB0Q29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRyaWJzLnR5cGUgPT09IFwibW9kdWxlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJpYnMuc3JjKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUltcG9ydChhdHRyaWJzLnNyYywgZmlsZW5hbWUpLnRoZW4ocmVsYXRpdmVVcmwgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChyZWxhdGl2ZVVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnMuc3JjID0gcmVsYXRpdmVVcmw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKG9wZW5UYWcobmFtZSwgYXR0cmlicykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytzY3JpcHRDb3VudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSBodG1sO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKG9wZW5UYWcobmFtZSwgYXR0cmlicykpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb25jbG9zZXRhZyhuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiBzY3JpcHRDb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGh0bWwuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBodG1sID0gc2NyaXB0Q29udGV4dDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRuYW1lID0gZmlsZW5hbWUgKyBcIiA8XCIgKyBzY3JpcHRDb3VudCArIFwiPiBbc21dXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWJlbFRyYW5zZm9ybWVyKHNjcmlwdG5hbWUsIHRleHQpLnRoZW4oKHtjb250ZW50LCBsaW5rc30pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW1wb3J0VXJsIG9mIGxpbmtzISkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKGltcG9ydFVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goY2xvc2VUYWcobmFtZSkpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgb250ZXh0KHRleHQpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0ZXh0KTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uY29tbWVudCh0ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoL1xcdyplc25leHQ6Y29ubmVjdFxcdyovLnRlc3QodGV4dCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goZXNuZXh0Q29ubmVjdFNjcmlwdCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChjb21tZW50KHRleHQpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uY2RhdGFzdGFydCgpIHtcclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIjwhW0NEQVRBW1wiKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uY2RhdGFlbmQoKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goXCJdXT5cIik7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvbmVycm9yKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoXCJmYWlsZWQgdG8gdHJhbnNmb3JtIGh0bWwgZmlsZTogXCIsIGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBhc3luYyBvbmVuZCgpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGggPSAwOyBoIDwgaHRtbC5sZW5ndGg7IGgrKykgaWYgKHR5cGVvZiBodG1sW2hdICE9PSBcInN0cmluZ1wiKSB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWxbaF0gPSBhd2FpdCBodG1sW2hdO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogaHRtbC5qb2luKFwiXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydHNcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgICAgeG1sTW9kZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGRlY29kZUVudGl0aWVzOiB0cnVlLFxyXG4gICAgICAgICAgICByZWNvZ25pemVDREFUQTogdHJ1ZSxcclxuICAgICAgICAgICAgcmVjb2duaXplU2VsZkNsb3Npbmc6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3RyZWFtLmVuZChjb250ZW50KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGh0bWxUcmFuc2Zvcm1lcihmaWxlbmFtZTpzdHJpbmcsIGNvbnRlbnQ6c3RyaW5nKTogUHJvbWlzZTxUcmFuc2Zvcm1lck91dHB1dD4ge1xyXG4gICAgICAgIGNvbnN0IHtodG1sLCBpbXBvcnRzfSA9IGF3YWl0IHRyYW5zZm9ybUh0bWxBc3luYyhmaWxlbmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY29udGVudDogaHRtbCxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSFRNTF9DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IEJ1ZmZlci5ieXRlTGVuZ3RoKGh0bWwpLFxyXG4gICAgICAgICAgICAgICAgXCJ4LXRyYW5zZm9ybWVyXCI6IFwiaHRtbC10cmFuc2Zvcm1lclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxpbmtzOiBbLi4uaW1wb3J0c11cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaHRtbFRyYW5zZm9ybWVyXHJcbiAgICB9O1xyXG59KTtcclxuIl19