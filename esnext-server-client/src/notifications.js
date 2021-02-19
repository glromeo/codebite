const sheet = new CSSStyleSheet();

sheet.replaceSync(`

#container {
    
    position: fixed;
    z-index: 10000;
    top: 8px;
    right: 8px;
    max-width: 0;
    height: 30vw;
    background: none;
    opacity: 0;
    transition: opacity 0.25s ease-out, max-width 0.125s ease-out;
    
    display: flex;
    flex-direction: column;
    text-align: right;
    overflow: visible;
}

#container.visible {
    max-width: 60vw;
    opacity: 1;
    transition: opacity 0.25s ease-in, max-width 0.5s ease-in;
}

#container.visible.timeout {
    opacity: .9;
}

.slot {
    overflow: visible;
    max-height: 0;
    opacity: 0;
    transition: all 0.25s ease-out;
}

.slot.connected {
    max-height: 0;
    opacity: 1;
    transition: all 0.25s ease-in;
}

.notification {
    display: inline-block;
    font-family: sans-serif;
    border-radius: 8px;
    margin: 4px;
    padding: 8px 16px;
    pointer-events: none;
    position: relative;
    color: white;
    background: black;
    box-shadow: -2px 3px 2px 0 rgba(0, 0, 0, 0.125), 4px 4px 2px 0 rgba(0, 0, 0, 0.125);
}

.notification.sticky {
    padding-right: 32px;
}

.notification.sticky:after {
    position: absolute;
    content: '✕';
    font-weight: bolder;
    right: 12px;
    top: 8px;
    cursor: pointer;
    pointer-events: all;
}

.notification.primary {
    background: #3e3f3a;
}

.notification.secondary {
    background: slategray;
}

.notification.info {
    background: cornflowerblue;
}

.notification.success {
    background: forestgreen;
}

.notification.warning {
    background: orange;
}

.notification.danger {
    background: crimson;
}

`);

customElements.define("esnext-notifications", class ESNextNotifications extends HTMLElement {

    constructor() {
        super();
        let autoHide;
        this.addEventListener("mouseenter", () => {
            autoHide = !!this.hideTimeout;
            this.show();
        });
        this.addEventListener("mouseout", () => {
            this.show(autoHide);
        });
    }

    get containerElement() {
        return this.renderRoot.getElementById("container");
    }

    set items(items) {
        this.containerElement.innerHTML = "";
        for (const item of items) {
            this.add(item);
        }
    }

    connectedCallback() {
        this.renderRoot = this.attachShadow({mode: "open"});
        this.renderRoot.adoptedStyleSheets = [sheet];
        this.renderRoot.innerHTML = `<div id="container">${this.innerHTML}</div>`;
    }

    show(autoHide = false) {
        if (autoHide) {
            this.hide(2500);
        } else {
            clearTimeout(this.hideTimeout);
            this.containerElement.classList.remove("timeout");
        }
        this.containerElement.classList.add("visible");
    }

    hide(timeoutMs = 0) {
        clearTimeout(this.hideTimeout);
        this.containerElement.classList.add("timeout");
        this.hideTimeout = setTimeout(() => {
            this.containerElement.classList.remove("visible");
        }, timeoutMs);
    }

    add({type = "default", content = ""} = randomItem(), sticky = false) {
        this.ready = (async (ready) => {
            await ready;
            let slot = document.createElement("div");
            slot.classList.add("slot");
            const notification = document.createElement("div");
            notification.classList.add("notification", type);
            const dismiss = () => {
                slot.style.maxHeight = null;
                slot.classList.remove("connected");
                slot.addEventListener("transitionend", (event) => {
                    if (slot) {
                        this.containerElement.removeChild(slot);
                        slot = null;
                    }
                });
            };
            if (sticky) {
                notification.classList.add("sticky");
                notification.addEventListener("click", dismiss);
            } else {
                setTimeout(dismiss, 3000);
            }
            notification.innerHTML = content;
            slot.appendChild(notification);
            this.containerElement.appendChild(slot);
            this.show(true);
            return new Promise(resolve => setTimeout(() => {
                slot.classList.add("connected");
                slot.style.maxHeight = `${notification.getBoundingClientRect().height + 8}px`;
                setTimeout(resolve, 125);
            }));
        })(this.ready);
    }
});

const ALL_ITEMS = [
    {type: "primary", content: "Primary"},
    {type: "secondary", content: "Secondary"},
    {type: "info", content: "Info"},
    {type: "success", content: "Success"},
    {type: "warning", content: "Warning"},
    {type: "danger", content: "Danger"}
];

function randomItem() {
    return ALL_ITEMS[Math.round(Math.random() * ALL_ITEMS.length)];
}

window.addEventListener("DOMContentLoaded", (event) => {
    const notifications = document.body.appendChild(document.createElement("esnext-notifications"));
    notifications.items = [...ALL_ITEMS];
});