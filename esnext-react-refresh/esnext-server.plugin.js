const preProcess = (filename, code) => `// [HMR] React Fast Refresh
import {createHotContext, performReactRefresh} from "esnext-react-refresh"; 
import.meta.hot = createHotContext(import.meta.url);

${code}

import.meta.hot.accept(({ module }) => {
    console.log("[HMR] react fast refresh:", import.meta.url);
    performReactRefresh();
});
`;

module.exports = {
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