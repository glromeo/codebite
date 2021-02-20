"use strict";
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
        this.renderRoot = this.attachShadow({ mode: "open" });
        this.renderRoot.adoptedStyleSheets = [sheet];
        this.renderRoot.innerHTML = `<div id="container">${this.innerHTML}</div>`;
    }
    show(autoHide = false) {
        if (autoHide) {
            this.hide(2500);
        }
        else {
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
    add({ id, type = "default", message = "" }, sticky = false) {
        this.ready = (async (ready) => {
            await ready;
            let slot = document.createElement("div");
            slot.classList.add("slot");
            slot.setAttribute("id", id);
            const notification = document.createElement("div");
            notification.setAttribute("class", `notification ${type}`);
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
            }
            else {
                setTimeout(dismiss, 3000);
            }
            notification.innerHTML = message;
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
    // TODO: handle change in sticky/dismiss
    update({ id, type = "default", message = "" }) {
        this.ready = (async (ready) => {
            await ready;
            const slot = this.renderRoot.getElementById(id);
            if (!slot) {
                return;
            }
            const notification = slot.firstElementChild;
            notification.setAttribute("class", `notification ${type}`);
            notification.innerHTML = message;
            this.show(true);
        })(this.ready);
    }
});
const ws = new WebSocket(`${location.protocol === "http:" ? "ws:" : "wss:"}//${location.host}/`, "esnext-alert");
window.addEventListener("DOMContentLoaded", (event) => {
    const notifications = document.body.appendChild(document.createElement("esnext-notifications"));
    console.log("notifications ready");
    ws.onopen = event => {
        console.log("websocket open");
    };
    ws.onmessage = event => {
        let message = event.data;
        if (message.startsWith("notification:")) {
            message = message.substring(13);
            if (message.startsWith("new:")) {
                message = message.substring(4);
                notifications.add(JSON.parse(message));
            }
            else if (message.startsWith("update:")) {
                message = message.substring(7);
                notifications.update(JSON.parse(message));
            }
            else {
                console.error("unable to handle web socket message", event.data);
            }
        }
    };
    ws.onerror = event => {
        console.log("websocket error", event);
    };
    ws.onclose = event => {
        document.removeChild(notifications);
        console.warn("websocket closed");
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9ub3RpZmljYXRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO0FBRWxDLEtBQUssQ0FBQyxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4RmpCLENBQUMsQ0FBQztBQUVILGNBQWMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxtQkFBb0IsU0FBUSxXQUFXO0lBRXZGO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLFFBQVEsQ0FBQztRQUNiLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUM5QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELElBQUksZ0JBQWdCO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLEtBQUs7UUFDWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNyQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xC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LE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3RDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUM3QztpQkFBTTtnQkFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwRTtTQUNKO0lBQ0wsQ0FBQyxDQUFDO0lBRUYsRUFBRSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsRUFBRTtRQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQztJQUVGLEVBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEVBQUU7UUFDakIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDckMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzaGVldCA9IG5ldyBDU1NTdHlsZVNoZWV0KCk7XG5cbnNoZWV0LnJlcGxhY2VTeW5jKGBcblxuI2NvbnRhaW5lciB7XG4gICAgXG4gICAgcG9zaXRpb246IGZpeGVkO1xuICAgIHotaW5kZXg6IDEwMDAwO1xuICAgIHRvcDogOHB4O1xuICAgIHJpZ2h0OiA4cHg7XG4gICAgbWF4LXdpZHRoOiAwO1xuICAgIGhlaWdodDogMzB2dztcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjI1cyBlYXNlLW91dCwgbWF4LXdpZHRoIDAuMTI1cyBlYXNlLW91dDtcbiAgICBcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgb3ZlcmZsb3c6IHZpc2libGU7XG59XG5cbiNjb250YWluZXIudmlzaWJsZSB7XG4gICAgbWF4LXdpZHRoOiA2MHZ3O1xuICAgIG9wYWNpdHk6IDE7XG4gICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjI1cyBlYXNlLWluLCBtYXgtd2lkdGggMC41cyBlYXNlLWluO1xufVxuXG4jY29udGFpbmVyLnZpc2libGUudGltZW91dCB7XG4gICAgb3BhY2l0eTogLjk7XG59XG5cbi5zbG90IHtcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgICBtYXgtaGVpZ2h0OiAwO1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNpdGlvbjogYWxsIDAuMjVzIGVhc2Utb3V0O1xufVxuXG4uc2xvdC5jb25uZWN0ZWQge1xuICAgIG1heC1oZWlnaHQ6IDA7XG4gICAgb3BhY2l0eTogMTtcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4yNXMgZWFzZS1pbjtcbn1cblxuLm5vdGlmaWNhdGlvbiB7XG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICBtYXJnaW46IDRweDtcbiAgICBwYWRkaW5nOiA4cHggMTZweDtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgY29sb3I6IHdoaXRlO1xuICAgIGJhY2tncm91bmQ6IGJsYWNrO1xuICAgIGJveC1zaGFkb3c6IC0ycHggM3B4IDJweCAwIHJnYmEoMCwgMCwgMCwgMC4xMjUpLCA0cHggNHB4IDJweCAwIHJnYmEoMCwgMCwgMCwgMC4xMjUpO1xufVxuXG4ubm90aWZpY2F0aW9uLnN0aWNreSB7XG4gICAgcGFkZGluZy1yaWdodDogMzJweDtcbn1cblxuLm5vdGlmaWNhdGlvbi5zdGlja3k6YWZ0ZXIge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBjb250ZW50OiAn4pyVJztcbiAgICBmb250LXdlaWdodDogYm9sZGVyO1xuICAgIHJpZ2h0OiAxMnB4O1xuICAgIHRvcDogOHB4O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICBwb2ludGVyLWV2ZW50czogYWxsO1xufVxuXG4ubm90aWZpY2F0aW9uLnByaW1hcnkge1xuICAgIGJhY2tncm91bmQ6ICMzZTNmM2E7XG59XG5cbi5ub3RpZmljYXRpb24uc2Vjb25kYXJ5IHtcbiAgICBiYWNrZ3JvdW5kOiBzbGF0ZWdyYXk7XG59XG5cbi5ub3RpZmljYXRpb24uaW5mbyB7XG4gICAgYmFja2dyb3VuZDogY29ybmZsb3dlcmJsdWU7XG59XG5cbi5ub3RpZmljYXRpb24uc3VjY2VzcyB7XG4gICAgYmFja2dyb3VuZDogZm9yZXN0Z3JlZW47XG59XG5cbi5ub3RpZmljYXRpb24ud2FybmluZyB7XG4gICAgYmFja2dyb3VuZDogb3JhbmdlO1xufVxuXG4ubm90aWZpY2F0aW9uLmRhbmdlciB7XG4gICAgYmFja2dyb3VuZDogY3JpbXNvbjtcbn1cblxuYCk7XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImVzbmV4dC1ub3RpZmljYXRpb25zXCIsIGNsYXNzIEVTTmV4dE5vdGlmaWNhdGlvbnMgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgbGV0IGF1dG9IaWRlO1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWVudGVyXCIsICgpID0+IHtcbiAgICAgICAgICAgIGF1dG9IaWRlID0gISF0aGlzLmhpZGVUaW1lb3V0O1xuICAgICAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3coYXV0b0hpZGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXQgY29udGFpbmVyRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyUm9vdC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lclwiKTtcbiAgICB9XG5cbiAgICBzZXQgaXRlbXMoaXRlbXMpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICAgICAgdGhpcy5hZGQoaXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJSb290ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6IFwib3BlblwifSk7XG4gICAgICAgIHRoaXMucmVuZGVyUm9vdC5hZG9wdGVkU3R5bGVTaGVldHMgPSBbc2hlZXRdO1xuICAgICAgICB0aGlzLnJlbmRlclJvb3QuaW5uZXJIVE1MID0gYDxkaXYgaWQ9XCJjb250YWluZXJcIj4ke3RoaXMuaW5uZXJIVE1MfTwvZGl2PmA7XG4gICAgfVxuXG4gICAgc2hvdyhhdXRvSGlkZSA9IGZhbHNlKSB7XG4gICAgICAgIGlmIChhdXRvSGlkZSkge1xuICAgICAgICAgICAgdGhpcy5oaWRlKDI1MDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJ0aW1lb3V0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwidmlzaWJsZVwiKTtcbiAgICB9XG5cbiAgICBoaWRlKHRpbWVvdXRNcyA9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInRpbWVvdXRcIik7XG4gICAgICAgIHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwidmlzaWJsZVwiKTtcbiAgICAgICAgfSwgdGltZW91dE1zKTtcbiAgICB9XG5cbiAgICBhZGQoe2lkLCB0eXBlID0gXCJkZWZhdWx0XCIsIG1lc3NhZ2UgPSBcIlwifSwgc3RpY2t5ID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5yZWFkeSA9IChhc3luYyAocmVhZHkpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHJlYWR5O1xuICAgICAgICAgICAgbGV0IHNsb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgc2xvdC5jbGFzc0xpc3QuYWRkKFwic2xvdFwiKTtcbiAgICAgICAgICAgIHNsb3Quc2V0QXR0cmlidXRlKFwiaWRcIiwgaWQpO1xuICAgICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgbm90aWZpY2F0aW9uICR7dHlwZX1gKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc21pc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2xvdC5zdHlsZS5tYXhIZWlnaHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNsb3QuY2xhc3NMaXN0LnJlbW92ZShcImNvbm5lY3RlZFwiKTtcbiAgICAgICAgICAgICAgICBzbG90LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LnJlbW92ZUNoaWxkKHNsb3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoc3RpY2t5KSB7XG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJzdGlja3lcIik7XG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkaXNtaXNzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChkaXNtaXNzLCAzMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5pbm5lckhUTUwgPSBtZXNzYWdlO1xuICAgICAgICAgICAgc2xvdC5hcHBlbmRDaGlsZChub3RpZmljYXRpb24pO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKHNsb3QpO1xuICAgICAgICAgICAgdGhpcy5zaG93KHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2xvdC5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGVkXCIpO1xuICAgICAgICAgICAgICAgIHNsb3Quc3R5bGUubWF4SGVpZ2h0ID0gYCR7bm90aWZpY2F0aW9uLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCArIDh9cHhgO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgMTI1KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkodGhpcy5yZWFkeSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogaGFuZGxlIGNoYW5nZSBpbiBzdGlja3kvZGlzbWlzc1xuICAgIHVwZGF0ZSh7aWQsIHR5cGUgPSBcImRlZmF1bHRcIiwgbWVzc2FnZSA9IFwiXCJ9KSB7XG4gICAgICAgIHRoaXMucmVhZHkgPSAoYXN5bmMgKHJlYWR5KSA9PiB7XG4gICAgICAgICAgICBhd2FpdCByZWFkeTtcbiAgICAgICAgICAgIGNvbnN0IHNsb3QgPSB0aGlzLnJlbmRlclJvb3QuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICAgICAgaWYgKCFzbG90KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gc2xvdC5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgbm90aWZpY2F0aW9uICR7dHlwZX1gKTtcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5pbm5lckhUTUwgPSBtZXNzYWdlO1xuICAgICAgICAgICAgdGhpcy5zaG93KHRydWUpO1xuICAgICAgICB9KSh0aGlzLnJlYWR5KTtcbiAgICB9XG59KTtcblxuY29uc3Qgd3MgPSBuZXcgV2ViU29ja2V0KGAke2xvY2F0aW9uLnByb3RvY29sID09PSBcImh0dHA6XCIgPyBcIndzOlwiIDogXCJ3c3M6XCJ9Ly8ke2xvY2F0aW9uLmhvc3R9L2AsIFwiZXNuZXh0LWFsZXJ0XCIpO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKGV2ZW50KSA9PiB7XG5cbiAgICBjb25zdCBub3RpZmljYXRpb25zID0gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZXNuZXh0LW5vdGlmaWNhdGlvbnNcIikpO1xuXG4gICAgY29uc29sZS5sb2coXCJub3RpZmljYXRpb25zIHJlYWR5XCIpO1xuXG4gICAgd3Mub25vcGVuID0gZXZlbnQgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIndlYnNvY2tldCBvcGVuXCIpO1xuICAgIH07XG5cbiAgICB3cy5vbm1lc3NhZ2UgPSBldmVudCA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlID0gZXZlbnQuZGF0YTtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChcIm5vdGlmaWNhdGlvbjpcIikpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnN1YnN0cmluZygxMyk7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKFwibmV3OlwiKSkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnN1YnN0cmluZyg0KTtcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25zLmFkZChKU09OLnBhcnNlKG1lc3NhZ2UpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKFwidXBkYXRlOlwiKSkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25zLnVwZGF0ZShKU09OLnBhcnNlKG1lc3NhZ2UpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInVuYWJsZSB0byBoYW5kbGUgd2ViIHNvY2tldCBtZXNzYWdlXCIsIGV2ZW50LmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHdzLm9uZXJyb3IgPSBldmVudCA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwid2Vic29ja2V0IGVycm9yXCIsIGV2ZW50KTtcbiAgICB9O1xuXG4gICAgd3Mub25jbG9zZSA9IGV2ZW50ID0+IHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlQ2hpbGQobm90aWZpY2F0aW9ucyk7XG4gICAgICAgIGNvbnNvbGUud2FybihcIndlYnNvY2tldCBjbG9zZWRcIik7XG4gICAgfTtcbn0pO1xuIl19