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
    add({ type = "default", content = "" } = randomItem(), sticky = false) {
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
            }
            else {
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
    { type: "primary", content: "Primary" },
    { type: "secondary", content: "Secondary" },
    { type: "info", content: "Info" },
    { type: "success", content: "Success" },
    { type: "warning", content: "Warning" },
    { type: "danger", content: "Danger" }
];
function randomItem() {
    return ALL_ITEMS[Math.round(Math.random() * ALL_ITEMS.length)];
}
window.addEventListener("DOMContentLoaded", (event) => {
    const notifications = document.body.appendChild(document.createElement("esnext-notifications"));
    notifications.items = [...ALL_ITEMS];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9ub3RpZmljYXRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO0FBRWxDLEtBQUssQ0FBQyxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4RmpCLENBQUMsQ0FBQztBQUVILGNBQWMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxtQkFBb0IsU0FBUSxXQUFXO0lBRXZGO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLFFBQVEsQ0FBQztRQUNiLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUM5QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELElBQUksZ0JBQWdCO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLEtBQUs7UUFDWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNyQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xC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RUQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7SUFDbEQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7SUFDaEcsYUFBYSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzaGVldCA9IG5ldyBDU1NTdHlsZVNoZWV0KCk7XHJcblxyXG5zaGVldC5yZXBsYWNlU3luYyhgXHJcblxyXG4jY29udGFpbmVyIHtcclxuICAgIFxyXG4gICAgcG9zaXRpb246IGZpeGVkO1xyXG4gICAgei1pbmRleDogMTAwMDA7XHJcbiAgICB0b3A6IDhweDtcclxuICAgIHJpZ2h0OiA4cHg7XHJcbiAgICBtYXgtd2lkdGg6IDA7XHJcbiAgICBoZWlnaHQ6IDMwdnc7XHJcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xyXG4gICAgb3BhY2l0eTogMDtcclxuICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4yNXMgZWFzZS1vdXQsIG1heC13aWR0aCAwLjEyNXMgZWFzZS1vdXQ7XHJcbiAgICBcclxuICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gICAgdGV4dC1hbGlnbjogcmlnaHQ7XHJcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcclxufVxyXG5cclxuI2NvbnRhaW5lci52aXNpYmxlIHtcclxuICAgIG1heC13aWR0aDogNjB2dztcclxuICAgIG9wYWNpdHk6IDE7XHJcbiAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IDAuMjVzIGVhc2UtaW4sIG1heC13aWR0aCAwLjVzIGVhc2UtaW47XHJcbn1cclxuXHJcbiNjb250YWluZXIudmlzaWJsZS50aW1lb3V0IHtcclxuICAgIG9wYWNpdHk6IC45O1xyXG59XHJcblxyXG4uc2xvdCB7XHJcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcclxuICAgIG1heC1oZWlnaHQ6IDA7XHJcbiAgICBvcGFjaXR5OiAwO1xyXG4gICAgdHJhbnNpdGlvbjogYWxsIDAuMjVzIGVhc2Utb3V0O1xyXG59XHJcblxyXG4uc2xvdC5jb25uZWN0ZWQge1xyXG4gICAgbWF4LWhlaWdodDogMDtcclxuICAgIG9wYWNpdHk6IDE7XHJcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4yNXMgZWFzZS1pbjtcclxufVxyXG5cclxuLm5vdGlmaWNhdGlvbiB7XHJcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcclxuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcclxuICAgIG1hcmdpbjogNHB4O1xyXG4gICAgcGFkZGluZzogOHB4IDE2cHg7XHJcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcclxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgIGNvbG9yOiB3aGl0ZTtcclxuICAgIGJhY2tncm91bmQ6IGJsYWNrO1xyXG4gICAgYm94LXNoYWRvdzogLTJweCAzcHggMnB4IDAgcmdiYSgwLCAwLCAwLCAwLjEyNSksIDRweCA0cHggMnB4IDAgcmdiYSgwLCAwLCAwLCAwLjEyNSk7XHJcbn1cclxuXHJcbi5ub3RpZmljYXRpb24uc3RpY2t5IHtcclxuICAgIHBhZGRpbmctcmlnaHQ6IDMycHg7XHJcbn1cclxuXHJcbi5ub3RpZmljYXRpb24uc3RpY2t5OmFmdGVyIHtcclxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgIGNvbnRlbnQ6ICfinJUnO1xyXG4gICAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICAgIHJpZ2h0OiAxMnB4O1xyXG4gICAgdG9wOiA4cHg7XHJcbiAgICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgICBwb2ludGVyLWV2ZW50czogYWxsO1xyXG59XHJcblxyXG4ubm90aWZpY2F0aW9uLnByaW1hcnkge1xyXG4gICAgYmFja2dyb3VuZDogIzNlM2YzYTtcclxufVxyXG5cclxuLm5vdGlmaWNhdGlvbi5zZWNvbmRhcnkge1xyXG4gICAgYmFja2dyb3VuZDogc2xhdGVncmF5O1xyXG59XHJcblxyXG4ubm90aWZpY2F0aW9uLmluZm8ge1xyXG4gICAgYmFja2dyb3VuZDogY29ybmZsb3dlcmJsdWU7XHJcbn1cclxuXHJcbi5ub3RpZmljYXRpb24uc3VjY2VzcyB7XHJcbiAgICBiYWNrZ3JvdW5kOiBmb3Jlc3RncmVlbjtcclxufVxyXG5cclxuLm5vdGlmaWNhdGlvbi53YXJuaW5nIHtcclxuICAgIGJhY2tncm91bmQ6IG9yYW5nZTtcclxufVxyXG5cclxuLm5vdGlmaWNhdGlvbi5kYW5nZXIge1xyXG4gICAgYmFja2dyb3VuZDogY3JpbXNvbjtcclxufVxyXG5cclxuYCk7XHJcblxyXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJlc25leHQtbm90aWZpY2F0aW9uc1wiLCBjbGFzcyBFU05leHROb3RpZmljYXRpb25zIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgbGV0IGF1dG9IaWRlO1xyXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBhdXRvSGlkZSA9ICEhdGhpcy5oaWRlVGltZW91dDtcclxuICAgICAgICAgICAgdGhpcy5zaG93KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNob3coYXV0b0hpZGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjb250YWluZXJFbGVtZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlclJvb3QuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGl0ZW1zKGl0ZW1zKSB7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLnJlbmRlclJvb3QgPSB0aGlzLmF0dGFjaFNoYWRvdyh7bW9kZTogXCJvcGVuXCJ9KTtcclxuICAgICAgICB0aGlzLnJlbmRlclJvb3QuYWRvcHRlZFN0eWxlU2hlZXRzID0gW3NoZWV0XTtcclxuICAgICAgICB0aGlzLnJlbmRlclJvb3QuaW5uZXJIVE1MID0gYDxkaXYgaWQ9XCJjb250YWluZXJcIj4ke3RoaXMuaW5uZXJIVE1MfTwvZGl2PmA7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvdyhhdXRvSGlkZSA9IGZhbHNlKSB7XHJcbiAgICAgICAgaWYgKGF1dG9IaWRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGlkZSgyNTAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oaWRlVGltZW91dCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwidGltZW91dFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJ2aXNpYmxlXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGhpZGUodGltZW91dE1zID0gMCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KTtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInRpbWVvdXRcIik7XHJcbiAgICAgICAgdGhpcy5oaWRlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInZpc2libGVcIik7XHJcbiAgICAgICAgfSwgdGltZW91dE1zKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGQoe3R5cGUgPSBcImRlZmF1bHRcIiwgY29udGVudCA9IFwiXCJ9ID0gcmFuZG9tSXRlbSgpLCBzdGlja3kgPSBmYWxzZSkge1xyXG4gICAgICAgIHRoaXMucmVhZHkgPSAoYXN5bmMgKHJlYWR5KSA9PiB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWR5O1xyXG4gICAgICAgICAgICBsZXQgc2xvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHNsb3QuY2xhc3NMaXN0LmFkZChcInNsb3RcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5jbGFzc0xpc3QuYWRkKFwibm90aWZpY2F0aW9uXCIsIHR5cGUpO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNtaXNzID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2xvdC5zdHlsZS5tYXhIZWlnaHQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgc2xvdC5jbGFzc0xpc3QucmVtb3ZlKFwiY29ubmVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgc2xvdC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQucmVtb3ZlQ2hpbGQoc2xvdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3QgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoc3RpY2t5KSB7XHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uY2xhc3NMaXN0LmFkZChcInN0aWNreVwiKTtcclxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGlzbWlzcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGRpc21pc3MsIDMwMDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5pbm5lckhUTUwgPSBjb250ZW50O1xyXG4gICAgICAgICAgICBzbG90LmFwcGVuZENoaWxkKG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5hcHBlbmRDaGlsZChzbG90KTtcclxuICAgICAgICAgICAgdGhpcy5zaG93KHRydWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHNsb3QuY2xhc3NMaXN0LmFkZChcImNvbm5lY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIHNsb3Quc3R5bGUubWF4SGVpZ2h0ID0gYCR7bm90aWZpY2F0aW9uLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCArIDh9cHhgO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCAxMjUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkodGhpcy5yZWFkeSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuY29uc3QgQUxMX0lURU1TID0gW1xyXG4gICAge3R5cGU6IFwicHJpbWFyeVwiLCBjb250ZW50OiBcIlByaW1hcnlcIn0sXHJcbiAgICB7dHlwZTogXCJzZWNvbmRhcnlcIiwgY29udGVudDogXCJTZWNvbmRhcnlcIn0sXHJcbiAgICB7dHlwZTogXCJpbmZvXCIsIGNvbnRlbnQ6IFwiSW5mb1wifSxcclxuICAgIHt0eXBlOiBcInN1Y2Nlc3NcIiwgY29udGVudDogXCJTdWNjZXNzXCJ9LFxyXG4gICAge3R5cGU6IFwid2FybmluZ1wiLCBjb250ZW50OiBcIldhcm5pbmdcIn0sXHJcbiAgICB7dHlwZTogXCJkYW5nZXJcIiwgY29udGVudDogXCJEYW5nZXJcIn1cclxuXTtcclxuXHJcbmZ1bmN0aW9uIHJhbmRvbUl0ZW0oKSB7XHJcbiAgICByZXR1cm4gQUxMX0lURU1TW01hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIEFMTF9JVEVNUy5sZW5ndGgpXTtcclxufVxyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIChldmVudCkgPT4ge1xyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9ucyA9IGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImVzbmV4dC1ub3RpZmljYXRpb25zXCIpKTtcclxuICAgIG5vdGlmaWNhdGlvbnMuaXRlbXMgPSBbLi4uQUxMX0lURU1TXTtcclxufSk7Il19