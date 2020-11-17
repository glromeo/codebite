import {html} from "lit-html";
import "./mz-button.mjs";

import {render} from "@codebite/workbench";

describe("materialize buttons", function () {

    it("primary", async function () {
        const element = render(html`<mz-button type="primary">Primary</mz-button>`);
    });

    it("secondary", async function () {
        const element = render(html`<mz-button type="secondary">Secondary</mz-button>`);
    });

});
