const preProcess = (filename, code) => `// [HMR] React Fast Refresh
import {createHotContext, performReactRefresh} from "/esnext-react-refresh/lib/plugin-client.js"; 
import.meta.hot = createHotContext(import.meta.url);

${code}

import.meta.hot.accept(performReactRefresh);
`;

module.exports = {
    mount: {
        ...require("esnext-server-client").mount,
        "/esnext-react-refresh": __dirname
    },
    babel: {
        plugins: [
            require("react-refresh/babel"),
            require("@babel/plugin-syntax-class-properties")
        ]
    },
    transform: {
        preProcess
    }
};