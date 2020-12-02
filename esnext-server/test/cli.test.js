describe("cli", function () {

    const path = require("path");

    jest.mock("lib/server.js");

    beforeEach(function () {

        jest.resetModules();
        delete require.cache[require.resolve("lib/cli.js")];

        require("lib/server.js").startServer.mockImplementation(async config => config);
    });

    it("can start a server specifying --config", async function () {

        process.argv = [
            "node.exe",
            "esnext-server",
            "--config",
            "test/fixture/cli/custom.config.js" // loadConfig uses resolve
        ];

        await require("lib/cli.js");

        expect(require("lib/server.js").startServer).toHaveBeenCalledWith(
            expect.objectContaining({
                resources: path.resolve(__dirname, "fixture/cli/custom.config/resources")
            })
        );
    });

    it("can start a server specifying --root", async function () {

        process.argv = [
            "node.exe",
            "esnext-server",
            "--root",
            "test/fixture/cli" // root is a path from the process cwd
        ];

        await require("lib/cli.js");

        expect(require("lib/server.js").startServer).toHaveBeenCalledWith(
            expect.objectContaining({
                resources: path.resolve(__dirname, "fixture/cli/esnext-server.config/resources")
            })
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

        await require("lib/cli.js");

        expect(require("lib/server.js").startServer).toHaveBeenCalledWith(
            expect.objectContaining({
                rootDir: path.resolve("demo"),
                resources: path.resolve(__dirname, "fixture/cli/custom.config/resources")
            })
        );
    });

});
