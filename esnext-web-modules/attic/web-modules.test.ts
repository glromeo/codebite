import {fail} from "assert";
import {expect} from "chai";
import * as fs from "fs";
import {existsSync, readFileSync, statSync} from "fs";
import {join, relative, resolve} from "path";
import {SourceMapConsumer} from "source-map";
import {defaultOptions, useWebModules, WebModulesOptions} from "./web-modules";

function readExports(path: string) {
    let out = fs.readFileSync(join(__dirname, path), "utf-8");
    let regExp = /export\s*{([^}]+)}/g;
    let exports = [], match;
    while ((match = regExp.exec(out))) {
        exports.push(...match[1].split(",").map(e => e.split(" as ").pop()!.trim()));
    }
    if (/export\s+default\s+/.test(out)) {
        exports.push("default");
    }
    return exports;
}

function readImportMap(path: string) {
    return JSON.parse(fs.readFileSync(join(__dirname, path), "utf-8"));
}

function readSourceMap(path: string) {
    let out = fs.readFileSync(join(__dirname, path + ".map"), "utf-8");
    return JSON.parse(out);
}

function readTextFile(path: string) {
    return readFileSync(join(__dirname, path), "utf-8");
}

describe("web modules", function () {

    const fixtureDir = resolve(__dirname, "fixture");

    function setup(workspace: string, override: Partial<WebModulesOptions> = defaultOptions()) {
        return useWebModules({
            ...override,
            clean: true,
            rootDir: fixtureDir + workspace,
            resolve: {
                ...override.resolve,
                moduleDirectory: ["fixture/node_modules"]
            }
        });
    }

    it("can read configuration", function () {
        const cwd = process.cwd();
        process.chdir(fixtureDir);
        let {outDir} = useWebModules();
        process.chdir(cwd);
        expect(relative(fixtureDir, outDir).replace(/\\/g, "/")).to.equal("web_modules");
    });

    it("can bundle react", async function () {

        let {rollupWebModule} = setup("/react");

        await rollupWebModule("react");

        let exports = readExports(`fixture/react/web_modules/react.js`);
        expect(exports).to.have.members([
            "Children",
            "Component",
            "Fragment",
            "Profiler",
            "PureComponent",
            "StrictMode",
            "Suspense",
            "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
            "cloneElement",
            "createContext",
            "createElement",
            "createFactory",
            "createRef",
            "forwardRef",
            "isValidElement",
            "lazy",
            "memo",
            "useCallback",
            "useContext",
            "useDebugValue",
            "useEffect",
            "useImperativeHandle",
            "useLayoutEffect",
            "useMemo",
            "useReducer",
            "useRef",
            "useState",
            "version",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "@fixture/react",
            "react",
            "react/index.js",
            "object-assign",
            "object-assign/index.js"
        ]);
    });

    it("can bundle react-dom (production)", async function (this:Mocha.Context) {

        this.timeout(10000);

        let {rollupWebModule} = setup("/react");

        const reactDomReady = rollupWebModule("react-dom");
        expect(rollupWebModule("react-dom")).to.equal(reactDomReady);                                    // PENDING TASK
        await reactDomReady;

        expect(rollupWebModule("react-dom")).to.equal(rollupWebModule("react-dom"));                 // ALREADY_RESOLVED

        let exports = readExports(`fixture/react/web_modules/react-dom.js`);
        expect(exports).to.have.members([
            "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
            "createPortal",
            "findDOMNode",
            "flushSync",
            "hydrate",
            "render",
            "unmountComponentAtNode",
            "unstable_batchedUpdates",
            "unstable_createPortal",
            "unstable_renderSubtreeIntoContainer",
            "version",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "@fixture/react",
            "react-dom",
            "react-dom/index.js",
            "object-assign",
            "object-assign/index.js",
            "react",
            "react/index.js"
        ]);

        let out = readTextFile(`fixture/react/web_modules/react-dom.js`);
        expect(out).to.have.string("export default reactDom;"); // default export workaround
        expect(out).not.to.have.string("var reactDom_production_min"); // make sure replace plugin works
    });

    it("can bundle prop-types", async function () {

        let {rollupWebModule, resolveImport} = setup("/react");

        await rollupWebModule("prop-types");

        let exports = readExports(`fixture/react/web_modules/prop-types.js`);
        expect(exports).to.have.members([
            "PropTypes",
            "any",
            "array",
            "arrayOf",
            "bool",
            "checkPropTypes",
            "element",
            "elementType",
            "exact",
            "func",
            "instanceOf",
            "node",
            "number",
            "object",
            "objectOf",
            "oneOf",
            "oneOfType",
            "resetWarningCache",
            "shape",
            "string",
            "symbol",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "@fixture/react",
            "object-assign",
            "object-assign/index.js",
            "prop-types",
            "prop-types/index.js",
            "react-is",
            "react-is/index.js"
        ]);

    });

    it("can bundle react-icons", async function () {

        let {rollupWebModule} = setup("/react");

        await rollupWebModule("react-icons/bs");

        let exports = readExports(`fixture/react/web_modules/react-icons.js`);
        expect(exports).to.have.members([
            "DefaultContext",
            "GenIcon",
            "IconBase",
            "IconContext",
            "IconsManifest"
        ]);

        let [importMap] = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(importMap).to.include.members([
            "react-icons/lib/esm/iconsManifest.js",
            "react-icons/lib/esm/iconBase.js",
            "react-icons/lib/esm/iconContext.js",
            "react-icons"
        ]);

    });

    it("can bundle countries-and-timezones", async function () {

        let {rollupWebModule, resolveImport} = setup("/iife");

        await rollupWebModule("countries-and-timezones");

        let exports = readExports(`fixture/iife/web_modules/countries-and-timezones.js`);
        expect(exports).to.have.members([
            "getAllCountries",
            "getAllTimezones",
            "getCountry",
            "getCountryForTimezone",
            "getTimezone",
            "getTimezonesForCountry",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/iife/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "countries-and-timezones/dist/index.js",
            "countries-and-timezones"
        ]);

    });

    it("can bundle antd", async function (this) {

        this.timeout(60000);

        let {rollupWebModule, resolveImport} = setup("/react");

        await rollupWebModule("antd");

        let exports = readExports(`fixture/react/web_modules/antd.js`);
        expect(exports).to.have.members([
            "Affix", "Alert", "Anchor", "AutoComplete", "Avatar", "BackTop", "Badge", "Breadcrumb", "Button",
            "Calendar", "Card", "Carousel", "Cascader", "Checkbox", "Col", "Collapse", "Comment", "ConfigProvider",
            "DatePicker", "Descriptions", "Divider", "Drawer", "Dropdown", "Empty", "Form", "Grid", "Image", "Input",
            "InputNumber", "Layout", "List", "Mentions", "Menu", "Modal", "PageHeader", "Pagination", "Popconfirm",
            "Popover", "Progress", "Radio", "Rate", "Result", "Row", "Select", "Skeleton", "Slider", "Space", "Spin",
            "Statistic", "Steps", "Switch", "Table", "Tabs", "Tag", "TimePicker", "Timeline", "Tooltip", "Transfer",
            "Tree", "TreeSelect", "Typography", "Upload", "message", "notification", "version"
        ]);

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports).to.include({
            "@babel/runtime": "/node_modules/@babel/runtime",
            "rc-util": "/node_modules/rc-util",
            "rc-util/es/KeyCode.js": "/web_modules/rc-util/es/KeyCode.js",
            "rc-util/es/getScrollBarSize.js": "/web_modules/rc-util/es/getScrollBarSize.js",
            "omit.js": "/web_modules/omit.js.js",
            "classnames": "/web_modules/classnames.js",
            "classnames/index.js": "/web_modules/classnames.js",
            "lodash": "/web_modules/lodash.js",
            "lodash/lodash.js": "/web_modules/lodash.js",
            "@babel/runtime/helpers/esm/typeof.js": "/web_modules/@babel/runtime/helpers/esm/typeof.js",
            "@babel/runtime/helpers/esm/extends.js": "/web_modules/@babel/runtime/helpers/esm/extends.js",
            "moment": "/web_modules/moment.js",
            "resize-observer-polyfill": "/web_modules/resize-observer-polyfill.js",
            "warning": "/web_modules/warning.js",
            "warning/warning.js": "/web_modules/warning.js",
            "shallowequal": "/web_modules/shallowequal.js",
            "shallowequal/index.js": "/web_modules/shallowequal.js",
            "@babel/runtime/regenerator/index.js": "/web_modules/@babel/runtime/regenerator/index.js",
            "react": "/web_modules/react.js",
            "react/index.js": "/web_modules/react.js",
            "rc-util/es/hooks/useMemo.js": "/web_modules/rc-util/es/hooks/useMemo.js",
            "react-is": "/web_modules/react-is.js",
            "react-is/index.js": "/web_modules/react-is.js",
            "lodash/isEqual.js": "/web_modules/lodash/isEqual.js",
            "rc-select/es/generate.js": "/web_modules/rc-select/es/generate.js",
            "antd": "/web_modules/antd.js",
            "antd/es/index.js": "/web_modules/antd.js"
        });

    });

    it("can bundle moment (dependency of antd)", async function () {
        let {rollupWebModule} = setup("/react");
        await rollupWebModule("moment");
        expect(existsSync(join(__dirname, "fixture/react/web_modules/moment.js"))).to.be.true;
    });

    it("can bundle lodash (dependency of antd)", async function () {
        let {rollupWebModule} = setup("/react");
        await rollupWebModule("lodash");
        expect(existsSync(join(__dirname, "fixture/react/web_modules/lodash.js"))).to.be.true;
    });

    it("can bundle lit-html (with ts sourcemap)", async function () {

        let {rollupWebModule, resolveImport} = setup("/lit-html");

        await rollupWebModule("lit-html");

        let exports = readExports(`fixture/lit-html/web_modules/lit-html.js`);
        expect(exports).to.have.members([
            "AttributeCommitter",
            "AttributePart",
            "BooleanAttributePart",
            "DefaultTemplateProcessor",
            "EventPart",
            "NodePart",
            "PropertyCommitter",
            "PropertyPart",
            "SVGTemplateResult",
            "Template",
            "TemplateInstance",
            "TemplateResult",
            "boundAttributeSuffix",
            "createMarker",
            "defaultTemplateProcessor",
            "directive",
            "html",
            "isCEPolyfill",
            "isDirective",
            "isIterable",
            "isPrimitive",
            "isTemplatePartActive",
            "lastAttributeNameRegex",
            "marker",
            "markerRegex",
            "noChange",
            "nodeMarker",
            "nothing",
            "parts",
            "removeNodes",
            "render",
            "reparentNodes",
            "svg",
            "templateCaches",
            "templateFactory"
        ]);

        let {imports} = readImportMap(`fixture/lit-html/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "lit-html",
            "lit-html/lit-html.js",
            "lit-html/lib/default-template-processor.js",
            "lit-html/lib/parts.js",
            "lit-html/lib/directive.js",
            "lit-html/lib/dom.js",
            "lit-html/lib/part.js",
            "lit-html/lib/template-instance.js",
            "lit-html/lib/template.js",
            "lit-html/lib/template-result.js",
            "lit-html/lib/render.js",
            "lit-html/lib/template-factory.js"
        ]);

        let rawSourceMap = readSourceMap(`fixture/lit-html/web_modules/lit-html.js`);
        await SourceMapConsumer.with(rawSourceMap, null, consumer => {
            expect(consumer.sources).to.include.members([
                "../../node_modules/lit-html/src/lib/directive.ts",
                "../../node_modules/lit-html/src/lib/dom.ts",
                "../../node_modules/lit-html/src/lib/part.ts",
                "../../node_modules/lit-html/src/lib/template.ts",
                "../../node_modules/lit-html/src/lib/template-instance.ts",
                "../../node_modules/lit-html/src/lib/template-result.ts",
                "../../node_modules/lit-html/src/lib/parts.ts",
                "../../node_modules/lit-html/src/lib/default-template-processor.ts",
                "../../node_modules/lit-html/src/lib/template-factory.ts",
                "../../node_modules/lit-html/src/lib/render.ts",
                "../../node_modules/lit-html/src/lit-html.ts"
            ]);

            expect(
                consumer.originalPositionFor({line: 14, column: 0})
            ).to.eql({
                source: "../../node_modules/lit-html/src/lib/directive.ts",
                line: 17,
                column: 0,
                name: null
            });

            expect(
                consumer.generatedPositionFor({
                    source: "../../node_modules/lit-html/src/lit-html.ts",
                    line: 2,
                    column: 10
                })
            ).to.eql({
                line: 1212, column: 0, lastColumn: null
            });
        });

        expect(await resolveImport("lit-html/lib/render.js")).to.equal("/web_modules/lit-html.js");
        expect(await resolveImport("lit-html/lib/shady-render.js")).to.equal("/web_modules/lit-html/lib/shady-render.js");
        expect(await resolveImport("lit-html/directives/repeat.js")).to.equal("/web_modules/lit-html/directives/repeat.js");

        expect(
            readTextFile(`fixture/lit-html/web_modules/lit-html/directives/repeat.js`)
        ).to.have.string(
            `import {createMarker, directive, NodePart, removeNodes, reparentNodes} from "/web_modules/lit-html.js";`
        );
    });

    it("can bundle lit-html/lib/shady-render.js (with terser)", async function () {

        let {rollupWebModule, resolveImport} = setup("/lit-html", {terser: {}});

        expect(await resolveImport("lit-html/lib/shady-render.js")).to.equal("/web_modules/lit-html/lib/shady-render.js");
        expect(existsSync(join(__dirname, "fixture/web_modules/lit-html/lib/shady-render.js"))).to.be.false;

        await rollupWebModule("lit-html/lib/shady-render.js");

        let exports = readExports(`fixture/lit-html/web_modules/lit-html.js`);
        expect(exports).to.have.members([
            "AttributeCommitter",
            "AttributePart",
            "BooleanAttributePart",
            "DefaultTemplateProcessor",
            "EventPart",
            "NodePart",
            "PropertyCommitter",
            "PropertyPart",
            "SVGTemplateResult",
            "Template",
            "TemplateInstance",
            "TemplateResult",
            "boundAttributeSuffix",
            "createMarker",
            "defaultTemplateProcessor",
            "directive",
            "html",
            "isCEPolyfill",
            "isDirective",
            "isIterable",
            "isPrimitive",
            "isTemplatePartActive",
            "lastAttributeNameRegex",
            "marker",
            "markerRegex",
            "noChange",
            "nodeMarker",
            "nothing",
            "parts",
            "removeNodes",
            "render",
            "reparentNodes",
            "svg",
            "templateCaches",
            "templateFactory"
        ]);

        let {imports} = readImportMap(`fixture/lit-html/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "lit-html",
            "lit-html/lit-html.js",
            "lit-html/lib/default-template-processor.js",
            "lit-html/lib/parts.js",
            "lit-html/lib/directive.js",
            "lit-html/lib/dom.js",
            "lit-html/lib/part.js",
            "lit-html/lib/template-instance.js",
            "lit-html/lib/template.js",
            "lit-html/lib/template-result.js",
            "lit-html/lib/render.js",
            "lit-html/lib/template-factory.js"
        ]);

        try {
            readSourceMap(`fixture/lit-html/web_modules/lit-html.js`);
            fail("should not produce source maps");
        } catch ({code}) {
            expect(code).to.equal("ENOENT");
        }
    });

    it("to bundle lit-html is a prerequisite to bundle lit-html/lib/shady-render.js", async function () {
        let {rollupWebModule, resolveImport} = setup("/lit-html");
        await rollupWebModule("lit-html/lib/shady-render.js");
        expect(existsSync(join(__dirname, "fixture/lit-html/web_modules/lit-html.js"))).to.be.true;
    });

    it("to bundle lit-html is a prerequisite to bundle lit-html/lib/shady-render.js", async function () {
        let {rollupWebModule, resolveImport} = setup("/lit-html");
        await rollupWebModule("lit-html/lib/shady-render.js");
        expect(existsSync(join(__dirname, "fixture/lit-html/web_modules/lit-html.js"))).to.be.true;
    });

    it("can bundle lit-element", async function () {

        let {rollupWebModule} = setup("/lit-element");

        await rollupWebModule("lit-element");

        let exports = readExports(`fixture/lit-element/web_modules/lit-element.js`);
        expect(exports).to.have.members([
            "SVGTemplateResult",
            "TemplateResult",
            "html",
            "svg",
            "CSSResult",
            "LitElement",
            "UpdatingElement",
            "css",
            "customElement",
            "defaultConverter",
            "eventOptions",
            "internalProperty",
            "notEqual",
            "property",
            "query",
            "queryAll",
            "queryAssignedNodes",
            "queryAsync",
            "supportsAdoptingStyleSheets",
            "unsafeCSS"
        ]);

        let {imports} = readImportMap(`fixture/lit-element/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "lit-element",
            "lit-element/lib/css-tag.js",
            "lit-element/lit-element.js",
            "lit-html",
            "lit-html/lib/directive.js",
            "lit-html/lib/shady-render.js",
            "lit-html/lib/template.js",
            "lit-html/lit-html.js"
        ]);

        let contents = readTextFile(`fixture/lit-element/web_modules/lit-element.js`);
        expect(contents.substring(124, 155)).to.equal("from '/web_modules/lit-html.js'");
    });

    it("can bundle bootstrap", async function () {

        let {rollupWebModule} = setup("/bootstrap");

        await rollupWebModule("bootstrap");

        let exports = readExports(`fixture/bootstrap/web_modules/bootstrap.js`);
        expect(exports).to.have.members([
            "Alert",
            "Button",
            "Carousel",
            "Collapse",
            "Dropdown",
            "Modal",
            "Popover",
            "Scrollspy",
            "Tab",
            "Toast",
            "Tooltip",
            "Util",
            "default"
        ]);

        let {imports} = readImportMap(`fixture/bootstrap/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "jquery/dist/jquery.js",
            "jquery",
            "popper.js/dist/esm/popper.js",
            "popper.js",
            "bootstrap/dist/js/bootstrap.js",
            "bootstrap"
        ]);

        try {
            await rollupWebModule("bootstrap/dist/css/bootstrap.css");
            fail("web modules don't include extraneous resources");
        } catch (e) {
            expect(e.message).to.equal("Unexpected token (Note that you need plugins to import files that are not JavaScript)");
        }
    });


    it("can bundle @babel/runtime/helpers/...", async function () {

        let {rollupWebModule} = setup("/babel-runtime");

        await rollupWebModule("@babel/runtime/helpers/esm/decorate.js");
        await rollupWebModule("@babel/runtime/helpers/esm/extends.js");

        let module = readTextFile(`fixture/babel-runtime/web_modules/@babel/runtime/helpers/esm/decorate.js`);
        expect(module).to.have.string(`function _arrayWithHoles(arr) {\n  if (Array.isArray(arr)) return arr;\n}`);

        let {imports} = readImportMap(`fixture/babel-runtime/web_modules/import-map.json`);
        expect(imports).to.have.keys([
            "@babel/runtime",
            "@babel/runtime/helpers/esm/decorate.js",
            "@babel/runtime/helpers/esm/extends.js",
            "@fixture/babel-runtime"
        ]);

        expect(existsSync(`fixture/babel-runtime/web_modules/@babel/runtime.js`)).to.be.false;
    });


    it("can bundle redux & co.", async function () {

        this.timeout(10000);

        let {rollupWebModule} = setup("/redux");

        await rollupWebModule("@reduxjs/toolkit");
        await rollupWebModule("redux");
        await rollupWebModule("redux-logger");
        await rollupWebModule("redux-thunk");
        await rollupWebModule("react-redux");

        let exports = readExports(`fixture/redux/web_modules/redux.js`);
        expect(exports).to.include.members([
            "applyMiddleware",
            "bindActionCreators",
            "combineReducers",
            "compose",
            "createStore"
        ]);

        expect(readTextFile(`fixture/redux/web_modules/@reduxjs/toolkit.js`))
            .to.have.string(`export * from '/web_modules/redux.js';`);

        let {imports} = readImportMap(`fixture/redux/web_modules/import-map.json`);
        expect(imports).to.include.keys([
            "@reduxjs/toolkit",
            "@reduxjs/toolkit/dist/redux-toolkit.esm.js",
            "react",
            "react-dom",
            "react-is",
            "react-redux",
            "react-redux/es/hooks/useStore.js",
            "react-redux/es/index.js",
            "react-redux/es/utils/batch.js",
            "react/index.js",
            "redux",
            "redux-logger",
            "redux-logger/dist/redux-logger.js",
            "redux-thunk",
            "redux-thunk/es/index.js",
            "redux/es/redux.js"
        ]);
    });

    it("react & react-dom share object-assign causing split", async function () {

        this.timeout(10000);

        let {rollupWebModule, resolveImport} = setup("/react");

        await rollupWebModule("react");
        await rollupWebModule("react-dom");

        let {imports} = readImportMap(`fixture/react/web_modules/import-map.json`);
        expect(imports["object-assign"]).to.equal("/web_modules/object-assign.js");

        expect(existsSync(join(__dirname, "/web_modules/object-assign.js"))).to.be.false;

        await rollupWebModule("object-assign/index.js");

        let exports = readExports(`fixture/react/web_modules/object-assign.js`);
        expect(exports).to.have.members([
            "default"
        ]);

        expect(await resolveImport("object-assign/index.js")).to.equal("/web_modules/object-assign.js");
    })

    it("can bundle @ant-design/icons", async function () {

        this.timeout(60000);

        let {outDir, rollupWebModule, resolveImport} = setup("/ant-design");

        await rollupWebModule("@ant-design/icons");

        let {imports} = readImportMap(`/fixture/ant-design/web_modules/import-map.json`);
        expect(imports["@ant-design/icons"]).to.equal("/web_modules/@ant-design/icons.js");

        expect(existsSync(join(outDir, "/@ant-design/icons.js"))).to.be.true;
        expect(existsSync(join(outDir, "/@babel/runtime/helpers/esm/typeof.js"))).to.be.true;
    });
});
