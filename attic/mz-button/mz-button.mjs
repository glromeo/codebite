// import materializeStyles from "materialize-css/dist/css/materialize.min.css";
import customStyle from "../mz-base/materialize.scss";
import {customElement, LitElement, property, css} from "lit-element";
import {html} from "lit-html";
import "../mz-base/waves.js";
import wavesStyle from "../mz-base/waves.min.css";

Waves.init();

@customElement("mz-button")
class MZButton extends LitElement {

    static styles = [customStyle, wavesStyle, css`
        :host {
            display: contents;
        }
    `];

    @property()
    label;

    @property()
    type;

    firstUpdated() {
        Waves.attach(this.shadowRoot.firstElementChild);
    }

    render() {
        return html`<a class="waves-effect waves-light btn ${this.type}">${this.label}<slot></slot></a>`;
    }
}