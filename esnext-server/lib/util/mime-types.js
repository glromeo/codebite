"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentType = exports.CSS_CONTENT_TYPE = exports.SCSS_CONTENT_TYPE = exports.SASS_CONTENT_TYPE = exports.HTML_CONTENT_TYPE = exports.TYPESCRIPT_CONTENT_TYPE = exports.JAVASCRIPT_CONTENT_TYPE = exports.TEXT_CONTENT_TYPE = exports.JSON_CONTENT_TYPE = void 0;
const mime_db_1 = __importDefault(require("mime-db"));
exports.JSON_CONTENT_TYPE = "application/json; charset=UTF-8";
exports.TEXT_CONTENT_TYPE = "text/plain; charset=UTF-8";
exports.JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=UTF-8";
exports.TYPESCRIPT_CONTENT_TYPE = "application/x-typescript; charset=UTF-8";
exports.HTML_CONTENT_TYPE = "text/html; charset=UTF-8";
exports.SASS_CONTENT_TYPE = "text/x-sass; charset=UTF-8";
exports.SCSS_CONTENT_TYPE = "text/x-scss; charset=UTF-8";
exports.CSS_CONTENT_TYPE = "text/css; charset=UTF-8";
const mimeTypes = new Map();
for (const contentType of Object.getOwnPropertyNames(mime_db_1.default)) {
    const mimeType = mime_db_1.default[contentType];
    if (mimeType.extensions)
        for (const ext of mimeType.extensions) {
            mimeTypes.set(ext, mimeType);
            mimeType.contentType = `${contentType}; charset=${mimeType.charset || "UTF-8"}`;
        }
}
const JAVASCRIPT_MIME_TYPE = mimeTypes.get("js");
JAVASCRIPT_MIME_TYPE.extensions.push("jsx");
mimeTypes.set("jsx", JAVASCRIPT_MIME_TYPE);
const TYPESCRIPT_MIME_TYPE = {
    "source": "unknown",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["ts", "tsx"],
    "contentType": "application/x-typescript; charset=UTF-8"
};
mimeTypes.set("ts", TYPESCRIPT_MIME_TYPE);
mimeTypes.set("tsx", mimeTypes.get("ts"));
function contentType(filename = "") {
    const mimeType = mimeTypes.get(filename);
    if (mimeType) {
        return mimeType.contentType;
    }
    const dot = filename.lastIndexOf(".") + 1;
    if (dot > 0) {
        const mimeType = mimeTypes.get(filename.substring(dot));
        if (mimeType) {
            return mimeType.contentType;
        }
    }
}
exports.contentType = contentType;
//# sourceMappingURL=mime-types.js.map