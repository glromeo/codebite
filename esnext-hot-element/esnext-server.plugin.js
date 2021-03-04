const preProcess = (filename, code) => `// [HMR] ESNext Hot Element
import {createHotElementContext} from "/esnext-hot-element/lib/plugin-client.js"; 
import.meta.hot = createHotElementContext(import.meta.url);

${code}

import.meta.hot.accept(true);
`;

module.exports = {
    mount: {
        ...require("esnext-server-client").mount,
        "/esnext-hot-element": __dirname
    },
    transform: {
        preProcess(filename, code) {
            if (code.indexOf(" LitElement {") > 0) {
                return preProcess(filename, code);
            }
            return code;
        }
    }
};