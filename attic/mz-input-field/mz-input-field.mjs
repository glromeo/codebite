import {css, customElement, LitElement, property, query} from "lit-element";
import {html} from "lit-html";

import "../fa-icon/fa-icon.js";
import colors from "../mz-base/color-classes.scss";
import style from "./mz-input-field.scss";

@customElement("mz-input-field")
class MzInputField extends LitElement {

    static styles = [style, colors, css`
        :host {
            display: inline-flex;
            line-height: 1em;
            user-select: none; 
            position: relative;
        }
        input {
            font-family: Roboto, sans-serif;
            margin-bottom: -0.125em;
            flex: 1 1 auto;
        }
    `];

    @property({type: String})
    label;

    @property({type: Boolean, reflect: true})
    active;

    firstUpdated() {

    }

    @query("#input-field")
    inputElement;

    focusCallback() {
        this.active = true;
    }

    blurCallback() {
        this.active = this.inputElement.value;
    }

    clear() {
        this.inputElement.value = null;
        this.active = false;
    }

    render() {
        const active = this.active ? "active" : "";
        return html`
            <div class="input-field">
                <input id="input-field" type="text" @focus=${this.focusCallback} @blur=${this.blurCallback}>
                <label for="input-field" class=${active}>Search</label>
            </div>
        `;
    }
}

@customElement("mz-search-field")
class MzSearchField extends MzInputField {

    static styles = [super.styles, css`
        fa-icon {
            font-size: .9em;
            position: absolute;
            right: .125em;
            top: 25%;
        }
    `];

    render() {
        return html`
            ${super.render()}
            <fa-icon name=${this.active ? "times" : "search"} class=${this.active ? "red-text" : "black-text"} @click=${this.clear}></fa-icon>
        `;
    }
}