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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvaHRtbC10cmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBaUQ7QUFDakQsMkJBQTBCO0FBQzFCLDZDQUFtQztBQUNuQyxnRUFBb0M7QUFFcEMsd0VBQW1DO0FBQ25DLCtDQUFzRDtBQUN0RCxtREFBcUQ7QUFDckQsMkRBQXdEO0FBSzNDLFFBQUEsa0JBQWtCLEdBQUcsc0JBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUVoRCxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakUsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLGtDQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUMsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU87UUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7WUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJO2dCQUFFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLFdBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDO2lCQUNqRDtxQkFBTTtvQkFDSCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztpQkFDdEI7WUFDRCxPQUFPLElBQUksR0FBRyxHQUFHLENBQUM7U0FDckI7YUFBTTtZQUNILE9BQU8sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7U0FDM0I7SUFDTCxD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LENBQUMsQ0FBQztZQUNQLENBQUM7U0FFSixFQUFFO1lBQ0MsT0FBTyxFQUFFLEtBQUs7WUFDZCxjQUFjLEVBQUUsSUFBSTtZQUNwQixjQUFjLEVBQUUsSUFBSTtZQUNwQixvQkFBb0IsRUFBRSxJQUFJO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWUsRUFBRSxPQUFjO1FBQzFELE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSw4QkFBaUI7Z0JBQ2pDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUN6QyxlQUFlLEVBQUUsa0JBQWtCO2FBQ3RDO1lBQ0QsS0FBSyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDdEIsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPO1FBQ0gsZUFBZTtLQUNsQixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcbmltcG9ydCB7ZXNjYXBlfSBmcm9tIFwiaGVcIjtcbmltcG9ydCB7UGFyc2VyfSBmcm9tIFwiaHRtbHBhcnNlcjJcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IHtlc25leHRDb25uZWN0U2NyaXB0fSBmcm9tIFwiLi4vc2NyaXB0L2Nvbm5lY3RcIjtcbmltcG9ydCB7SFRNTF9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7dXNlQmFiZWxUcmFuc2Zvcm1lcn0gZnJvbSBcIi4vYmFiZWwtdHJhbnNmb3JtZXJcIjtcbmltcG9ydCB7VHJhbnNmb3JtZXJPdXRwdXR9IGZyb20gXCIuL2luZGV4XCI7XG5cbmV4cG9ydCB0eXBlIFRyYW5zZm9ybVJlc3VsdCA9IHsgaHRtbDogc3RyaW5nLCBpbXBvcnRzOiBTZXQ8c3RyaW5nPiB9O1xuXG5leHBvcnQgY29uc3QgdXNlSHRtbFRyYW5zZm9ybWVyID0gbWVtb2l6ZWQoY29uZmlnID0+IHtcblxuICAgIGNvbnN0IHtiYWJlbFRyYW5zZm9ybWVyfSA9IHVzZUJhYmVsVHJhbnNmb3JtZXIoY29uZmlnLCBcImlubGluZVwiKTtcbiAgICBjb25zdCB7cmVzb2x2ZUltcG9ydH0gPSB1c2VXZWJNb2R1bGVzKGNvbmZpZyk7XG5cbiAgICBmdW5jdGlvbiBvcGVuVGFnKG5hbWUsIGF0dHJpYnMpIHtcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnMpO1xuICAgICAgICBpZiAoa2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZXQgaHRtbCA9IFwiPFwiICsgbmFtZTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBrZXlzKSBpZiAoYXR0cmlicy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gYCAke25hbWV9PVwiJHtlc2NhcGUoYXR0cmlic1tuYW1lXSl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBodG1sICs9IFwiIFwiICsgbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBodG1sICsgXCI+XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCI8XCIgKyBuYW1lICsgXCI+XCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVRhZyhuYW1lKSB7XG4gICAgICAgIHJldHVybiBcIjwvXCIgKyBuYW1lICsgXCI+XCI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIFwiPFwiICsgZGF0YSArIFwiPlwiO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbW1lbnQodGV4dCkge1xuICAgICAgICByZXR1cm4gXCI8IS0tXCIgKyB0ZXh0ICsgXCItLT5cIjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1IdG1sQXN5bmMgPSBhc3luYyAoZmlsZW5hbWUsIGNvbnRlbnQpID0+IG5ldyBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgbGV0IHNjcmlwdENvdW50ID0gMDtcbiAgICAgICAgbGV0IHNjcmlwdENvbnRleHQ7XG4gICAgICAgIGxldCBodG1sOiAoc3RyaW5nIHwgUHJvbWlzZTxzdHJpbmc+KVtdID0gW107XG5cbiAgICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFBhcnNlcih7XG5cbiAgICAgICAgICAgIG9ucHJvY2Vzc2luZ2luc3RydWN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBodG1sLnB1c2gocHJvY2Vzc2luZ0luc3RydWN0aW9uKGRhdGEpKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9ub3BlbnRhZyhuYW1lLCBhdHRyaWJzKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiAhc2NyaXB0Q29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy50eXBlID09PSBcIm1vZHVsZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy5zcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVJbXBvcnQoYXR0cmlicy5zcmMsIGZpbGVuYW1lKS50aGVuKHJlbGF0aXZlVXJsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydHMuYWRkKHJlbGF0aXZlVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnMuc3JjID0gcmVsYXRpdmVVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlblRhZyhuYW1lLCBhdHRyaWJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytzY3JpcHRDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRDb250ZXh0ID0gaHRtbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBodG1sLnB1c2gob3BlblRhZyhuYW1lLCBhdHRyaWJzKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbmNsb3NldGFnKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzY3JpcHRcIiAmJiBzY3JpcHRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBodG1sLmpvaW4oXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgPSBzY3JpcHRDb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRuYW1lID0gZmlsZW5hbWUgKyBcIiA8XCIgKyBzY3JpcHRDb3VudCArIFwiPiBbc21dXCI7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVsVHJhbnNmb3JtZXIoc2NyaXB0bmFtZSwgdGV4dCkudGhlbigoe2NvbnRlbnQsIGxpbmtzfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW1wb3J0VXJsIG9mIGxpbmtzISkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRzLmFkZChpbXBvcnRVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGh0bWwucHVzaChjbG9zZVRhZyhuYW1lKSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbnRleHQodGV4dCkge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY29tbWVudCh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKC9cXHcqZXNuZXh0OmNvbm5lY3RcXHcqLy50ZXN0KHRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaChlc25leHRDb25uZWN0U2NyaXB0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goY29tbWVudCh0ZXh0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25jZGF0YXN0YXJ0KCkge1xuICAgICAgICAgICAgICAgIGh0bWwucHVzaChcIjwhW0NEQVRBW1wiKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY2RhdGFlbmQoKSB7XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKFwiXV0+XCIpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25lcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihcImZhaWxlZCB0byB0cmFuc2Zvcm0gaHRtbCBmaWxlOiBcIiwgZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhc3luYyBvbmVuZCgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gMDsgaCA8IGh0bWwubGVuZ3RoOyBoKyspIGlmICh0eXBlb2YgaHRtbFtoXSAhPT0gXCJzdHJpbmdcIikgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbFtoXSA9IGF3YWl0IGh0bWxbaF07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIGh0bWw6IGh0bWwuam9pbihcIlwiKSxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0c1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHhtbE1vZGU6IGZhbHNlLFxuICAgICAgICAgICAgZGVjb2RlRW50aXRpZXM6IHRydWUsXG4gICAgICAgICAgICByZWNvZ25pemVDREFUQTogdHJ1ZSxcbiAgICAgICAgICAgIHJlY29nbml6ZVNlbGZDbG9zaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHN0cmVhbS5lbmQoY29udGVudCk7XG4gICAgfSk7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBodG1sVHJhbnNmb3JtZXIoZmlsZW5hbWU6c3RyaW5nLCBjb250ZW50OnN0cmluZyk6IFByb21pc2U8VHJhbnNmb3JtZXJPdXRwdXQ+IHtcbiAgICAgICAgY29uc3Qge2h0bWwsIGltcG9ydHN9ID0gYXdhaXQgdHJhbnNmb3JtSHRtbEFzeW5jKGZpbGVuYW1lLCBjb250ZW50KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGh0bWwsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSFRNTF9DT05URU5UX1RZUEUsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBCdWZmZXIuYnl0ZUxlbmd0aChodG1sKSxcbiAgICAgICAgICAgICAgICBcIngtdHJhbnNmb3JtZXJcIjogXCJodG1sLXRyYW5zZm9ybWVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaW5rczogWy4uLmltcG9ydHNdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaHRtbFRyYW5zZm9ybWVyXG4gICAgfTtcbn0pO1xuIl19