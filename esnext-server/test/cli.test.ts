import {expect, fake, match, mockquire, unrequire} from "@codebite/testing";
import {resolve} from "path";

describe("cli", function () {

    let startServer = fake(async (config: any) => config);

    mockquire("../src/server", {
        startServer: startServer
    });

    beforeEach(function () {
        unrequire("yargs");
        unrequire("../src/cli");
        startServer.resetHistory();
    });

    it("can start a server specifying --config", async function () {

        process.argv = [
            "node.exe",
            "esnext-server",
            "--config",
            "test/fixture/cli/custom.config.js" // loadConfig uses resolve
        ];

        await require("../src/cli");

        expect(startServer).calledWith(
            match({resources: resolve(__dirname, "fixture/cli/custom.config/resources")})
        );
    });

    it("can start a server specifying --root", async function () {

        process.argv = [
            "node.exe",
            "esnext-server",
            "--root",
            "test/fixture/cli" // root is a path from the process cwd
        ];

        await require("../src/cli");

        expect(startServer).calledWith(
            match({resources: resolve(__dirname, "fixture/cli/esnext-server.config/resources")})
        );
    });

    it("can start a server specifying both --root and --config", async function () {

        process.argv = [
            "node.exe",
            "esnext-server",
            "--root",
            "demo",
            "--config",
            "test/fixture/cli/custom.config.js" // loadConfig uses resolve
        ];

        await require("../src/cli");

        expect(startServer).calledWith(
            match({
                rootDir: resolve("demo"),
                resources: resolve(__dirname, "fixture/cli/custom.config/resources")
            })
        );
    });

});
