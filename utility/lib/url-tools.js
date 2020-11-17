const path = require("path");

const urlRegExp = /(^(?<scheme>\w+):\/\/(?<domain>[^/?#]+)?)?((?<module>(@[\w-]+\/)?[^._/?#][^:/?#]*)(\/|$))?(?<pathname>[^?#]+)?(\?(?<search>[^#]+))?(#(?<fragment>.*))?/;
const NO_MATCH = {groups: {}};

module.exports.quickParseURL = function (url) {

    let match = url && urlRegExp.exec(url) || NO_MATCH;

    const {
        scheme,
        domain,
        module,
        pathname,
        search,
        fragment
    } = match.groups;

    return {
        href: url,
        scheme,
        domain,
        module,
        pathname,
        search,
        fragment
    };
};

module.exports.isBare = function (url) {
    let cc = url.charAt(0);
    if (cc === "/") return false;
    if (cc === ".") {
        if (url.length === 1) return false;
        cc = url.charAt(1);
        if (cc === "/") return false;
        if (cc === ".") {
            if (url.length === 2) return false;
            cc = url.charAt(2);
            if (cc === "/") return false;
        }
    }
    return true;
};

function nodeModulesRelativePath(filename) {
    const index = filename.lastIndexOf("/node_modules/");
    return index !== -1 ? filename.substring(index + 14) : filename;
}

const backslashRegExp = /\\/g;

module.exports.nodeModuleBareUrl = path.sep === "/"
    ? nodeModulesRelativePath
    : filename => nodeModulesRelativePath(filename.replace(backslashRegExp, "/"));


module.exports.parsePathname = pathname => {
    const namespace = pathname.charAt(0) === "@";
    const slash = namespace ? pathname.indexOf("/", pathname.indexOf("/", 1) + 1) : pathname.indexOf("/", 1);
    let module = pathname.substring(0, slash);
    let filename = pathname.substring(slash + 1);
    if (!module) {
        module = filename;
        filename = undefined;
    }
    return {module, filename};
};

module.exports.toPosix = path.sep === "/"
    ? pathname => pathname
    : pathname => pathname.replace(/\\/g, "/");
