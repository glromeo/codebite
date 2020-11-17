import {render, text} from "@codebite/workbench";
import {html} from "lit-html";
import "./mz-input-field.mjs";

describe("materialize buttons", function () {

    it("primary", async function () {
        const element = render(html`
            <div style="line-height: 2rem; background: white; font-size: ${(text("font-size", "24px"))}; line-height: ${(text("line-height", "1.5em"))}">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
            doloremque laudantium, 
            totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt 
            explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
            magni dolores eos qui ratione voluptatem <mz-input-field></mz-input-field> 
            sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia 
            dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et 
            dolore <mz-search-field></mz-search-field> magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam 
            corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure 
            reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum 
            fugiat quo voluptas nulla pariatur?</div>
        `);
    });

});
