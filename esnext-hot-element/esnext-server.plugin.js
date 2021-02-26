const preProcess = (filename, code) => `// [HMR] Hot Element
import {createHotContext, performHotModuleReplacement} from "esnext-hot-element"; 
import.meta.hot = createHotContext(import.meta.url);

${code}

import.meta.hot.accept(({ module }) => {
    console.log("[HMR] hot element:", import.meta.url);
    performHotModuleReplacement();
});
`;

module.exports = {
    transform: {
        preProcess
    }
};