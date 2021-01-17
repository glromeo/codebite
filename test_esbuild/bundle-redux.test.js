const esbuild = require("esbuild");
const resolve = require("resolve");
const {expect} = require("chai");

describe("issue with bundle", function () {

    it("when I don't use bundle it generates an ESM file as expected", async function () {

        await esbuild.build({
            entryPoints: ["react-redux"],
            define: {
                "process.env.NODE_ENV": `"development"`
            },
            outfile: "./esm-bundle.js"
        }).catch(reason => {
            console.error(reason);
        });


    });

    it("when I use onResolve then it generates a CJS file", async function () {

        await esbuild.build({
            entryPoints: ["react-redux"],
            bundle: true,
            format: "esm",
            define: {
                "process.env.NODE_ENV": `"development"`
            },
            outfile: "./cjs-bundle.js"
        }).catch(reason => {
            console.error(reason);
        });

        expect(require("fs").readFileSync("./cjs-bundle.js", "utf-8")).to.have.string("require(")

    });

});