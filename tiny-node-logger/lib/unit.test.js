"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importStar(require("chai"));
const sinon_1 = require("sinon");
const mock_require_1 = __importDefault(require("mock-require"));
chai_1.default.use(require("sinon-chai"));
describe("tiny-node-logger", function () {
    mock_require_1.default("chalk", new Proxy({}, {
        get: (target, p) => target[p] || (target[p] = (text) => p + "[" + text + "]")
    }));
    const chalk = require("chalk");
    const logger = require("../lib");
    const { log, stringify, default: { colors, trace, debug, info, warn, error } } = logger;
    let toISOString;
    beforeEach(function () {
        logger.compact = false;
        logger.details = false;
        logger.write = sinon_1.spy();
        let instant = 0;
        toISOString = global.Date.prototype.toISOString;
        global.Date.prototype.toISOString = sinon_1.spy(() => "1974-04-12T08:30:00." + String(instant++).padStart(3, "0"));
    });
    afterEach(function () {
        global.Date.prototype.toISOString = toISOString;
    });
    it("simplest form", function () {
        log `hello world`;
        chai_1.expect(logger.write).to.have.been.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.000] | hello world\n");
    });
    it("details", function () {
        logger.details = true;
        log `${"hello world"}`;
        chai_1.expect(logger.write).to.have.been.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.000] " +
            "|underline[unit.test            blueBright[45]:blueBright[12]]| " +
            "hello world\n");
    });
    it("compact", function () {
        logger.compact = true;
        log `hello world`;
        chai_1.expect(logger.write).to.have.been.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.000] > hello world\n");
    });
    it("details compact", function () {
        logger.details = true;
        logger.compact = true;
        log `hello world`;
        chai_1.expect(logger.write).to.have.been.calledWith("underline[unit.test            blueBright[64]:blueBright[12]]\n" +
            "             blue[1974-04-12] blueBright[08:30:00]cyan[.000] > hello world\n");
    });
    it("colors", function () {
        chai_1.expect(colors.trace).to.equal(chalk.gray);
        chai_1.expect(colors.debug).to.equal(chalk.blueBright);
        chai_1.expect(colors.info).to.equal(chalk.black);
        chai_1.expect(colors.warn).to.equal(chalk.yellow);
        chai_1.expect(colors.error).to.equal(chalk.red);
    });
    it("levels", function () {
        chai_1.expect(logger.level).to.equal("info");
        logger.level = "warn";
        chai_1.expect(logger.level).to.equal("warn");
        logger.level = "error";
        chai_1.expect(logger.level).to.equal("error");
        logger.level = "nothing";
        chai_1.expect(logger.level).to.equal("nothing");
        logger.level = "debug";
        chai_1.expect(logger.level).to.equal("debug");
        // noinspection JSValidateTypes
        chai_1.expect(() => logger.level = "unknown").to.throw("cannot set level: unknown");
        // noinspection JSValidateTypes
        chai_1.expect(() => logger.level = NaN).to.throw("cannot set level: NaN");
        logger.level = "info";
        chai_1.expect(logger.level).to.equal("info");
        logger.info("info");
        chai_1.expect(logger.write).to.callCount(1);
        logger.debug("debug");
        chai_1.expect(logger.write).to.callCount(1);
        logger.error("error");
        chai_1.expect(logger.write).to.callCount(2);
    });
    it("logging (classic)", function () {
        logger.info("info", 123);
        chai_1.expect(logger.write.firstCall).to.calledWith(`blue[1974-04-12] blueBright[08:30:00]cyan[.000] | info 123\n`);
        logger.debug("debug");
        chai_1.expect(logger.write).to.callCount(1);
        logger.warn("warning", { a: 0 }, { e1: { e2: { e3: { e4: { e5: 0 } } } } }, new Error("any error"));
        chai_1.expect(logger.write.secondCall).to.calledWithMatch("blue[1974-04-12] blueBright[08:30:00]cyan[.001]");
        chai_1.expect(logger.write.secondCall).to.calledWithMatch("yellow[warning]");
        chai_1.expect(logger.write.secondCall).to.calledWithMatch("{ a: [33m0[39m }");
        chai_1.expect(logger.write.secondCall).to.calledWithMatch("Error: any error\n    at Context.<anonymous> (");
        chai_1.expect(logger.write.secondCall).to.calledWithMatch("{\n  e1: { e2: { e3: { e4: \u001B[36m[Object]\u001B[39m } } }\n}");
        chai_1.expect(logger.write.secondCall).to.calledWithMatch(/[\n]$/);
        logger.trace("trace");
        chai_1.expect(logger.write).to.callCount(2);
    });
    it("logging (tagged template)", function () {
        logger.level = "TRACE";
        chai_1.expect(logger.level).to.equal("trace");
        trace `trace ${123} ${chalk.green("green")} `;
        chai_1.expect(logger.write.firstCall).to.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.000] | gray[trace ]gray[123] gray[green[green]] \n");
        chai_1.expect(logger.write).to.callCount(1);
        debug `debug`;
        chai_1.expect(logger.write.secondCall).to.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.001] | blueBright[debug]\n");
        warn `warning ${{ a: 0 }}, ${new Error("any error")} ${{ e1: { e2: { e3: { e4: { e5: 0 } } } } }}`;
        chai_1.expect(logger.write.thirdCall).to.calledWithMatch("blue[1974-04-12] blueBright[08:30:00]cyan[.002]");
        chai_1.expect(logger.write.thirdCall).to.calledWithMatch("yellow[warning ]");
        chai_1.expect(logger.write.thirdCall).to.calledWithMatch("{ a: [33m0[39m }");
        chai_1.expect(logger.write.thirdCall).to.calledWithMatch("Error: any error\n    at Context.<anonymous> (");
        chai_1.expect(logger.write.thirdCall).to.calledWithMatch("{\n  e1: { e2: { e3: { e4: \u001B[36m[Object]\u001B[39m } } }\n}");
        chai_1.expect(logger.write.thirdCall).to.calledWithMatch(/[\n]$/);
        info `info`;
        error `error`;
        chai_1.expect(logger.write).to.callCount(5);
    });
    it("logging nothing", function () {
        global.Date.prototype.toISOString = () => fail("shouldn't call timestamp()");
        logger.level = "nothing";
        logger.trace `it doesn't matter`;
        logger.debug `it doesn't matter`;
        logger.info `it doesn't matter`;
        logger.warn `it doesn't matter`;
        logger.error `it doesn't matter`;
        chai_1.expect(logger.write).not.to.have.been.called;
    });
    it("stringify", function () {
        chai_1.expect(stringify("something", chalk.black)).to.equal(chalk.black("something"));
        chai_1.expect(stringify("something", null)).to.equal("something");
        chai_1.expect(stringify("something")).to.equal("something");
    });
    it("can log timestamp, file and line number", function () {
        chai_1.expect(logger.details).not.to.be.ok;
        logger.level = "info";
        logger.details = true;
        logger.info("details enabled!");
        logger.warn("details enabled!");
        logger.error("details enabled!");
        chai_1.expect(logger.write.firstCall).to.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.000] |" +
            "underline[unit.test           blueBright[212]:blueBright[13]]| details enabled!\n");
        chai_1.expect(logger.write.secondCall).to.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.001] |" +
            "underline[unit.test           blueBright[213]:blueBright[13]]| yellow[details enabled!]\n");
        chai_1.expect(logger.write.thirdCall).to.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.002] |" +
            "underline[unit.test           blueBright[214]:blueBright[13]]| red[details enabled!]\n");
        logger.details = false;
        logger.info("details disabled!");
        chai_1.expect(logger.write).to.calledWith(`blue[1974-04-12] blueBright[08:30:00]cyan[.003] | details disabled!\n`);
    });
    it("long filename in details", function () {
        logger.details = 14;
        logger.info("details enabled!");
        chai_1.expect(logger.write).to.calledWith("blue[1974-04-12] blueBright[08:30:00]cyan[.000] |" +
            "underline[uni~blueBright[240]:blueBright[13]]| details enabled!\n");
        chai_1.expect(logger.compact).not.to.be.ok;
    });
});
//# sourceMappingURL=unit.test.js.map