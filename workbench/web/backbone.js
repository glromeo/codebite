const actions = new Map();

const backbone = {

    connected: false,

    send() {
        throw new Error("backbone not ready");
    },

    on(type, callback) {
        actions.set(type, callback);
    },

    listeners: [],

    set onchange(listener) {
        this.listeners.push(listener);
    },

    notify() {
        this.listeners.forEach(listener => listener(this));
    },

    remove(listener) {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }
};

backbone.ready = window.puppeteer ? new Promise(resolve => {

    backbone.send = (type, payload = null) => {
        window.backboneSend(`${type}:${JSON.stringify(payload)}`);
    };

    window.backboneReceive = message => {
        const sep = message.indexOf(":");
        let action, body;
        if (sep !== -1) {
            action = message.substring(0, sep);
            body = JSON.parse(message.substring(sep + 1));
            if (actions.has(action)) {
                actions.get(action).call(this, body);
            } else {
                console.log(action, body);
            }
        } else {
            action = message;
            console.log(action);
        }
    };

    setTimeout(function () {
        backbone.send("connected", "workbench");
        backbone.connected = true;
        backbone.notify();
    }, 250);

    resolve();

}) : new Promise(async resolve => {

    const ws = new WebSocket(`wss://${window.location.hostname}:${window.location.port}/`);

    ws.onopen = event => {

        ws.send(`connected:"workbench"`);

        backbone.send = (type, payload = null) => {
            ws.send(`${type}:${JSON.stringify(payload)}`);
        };

        backbone.connected = true;
        backbone.notify();
        resolve(backbone);
    };

    ws.onmessage = event => {
        const message = event.data;
        const sep = message.indexOf(":");
        let action, body;
        if (sep !== -1) {
            action = message.substring(0, sep);
            body = JSON.parse(message.substring(sep + 1));
            if (actions.has(action)) {
                actions.get(action).call(this, body);
            } else {
                console.log(action, body);
            }
        } else {
            action = message;
            console.log(action);
        }
    };

    ws.onerror = event => {
        console.log("websocket error", event);
    };

    ws.onclose = event => {
        backbone.connected = false;
        backbone.notify();
    };

});

export default backbone;
