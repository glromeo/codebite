const log = require("tiny-node-logger");
const path = require("path");
const merge = require("deepmerge");

const createConfig = require("../esnext-server.config");

function loadConfig(pathname) {
    try {
        return require(path.resolve(pathname));
    } catch (error) {
        throw new Error(`Unable to load config '${pathname}' from '${process.cwd()}', ${error.message}`);
    }
}

function resolveConfig(pathname) {
    try {
        return require.resolve(path.resolve(pathname));
    } catch (ignored) {
        return null;
    }
}

const mergeConfig = (target = {}, source = {}) => merge(target, source, {
    arrayMerge: (target, source) => [...new Set([...source, ...target])]
});

function loadPlugin(module) {
    try {
        return require(`${module}/esnext-server.plugin`);
    } catch (error) {
        log.error("plugin", module, "load failed", error);
        throw new Error(`Unable to load plugin '${module}' from '${process.cwd()}'`);
    }
}

module.exports.configure = function configure(args = {}, override) {

    let config = createConfig(args);

    if (args.config) {
        config = mergeConfig(config, loadConfig(args.config));
    } else {
        const rootConfig = resolveConfig(path.join(config.rootDir, "esnext-server.config"));
        const localConfig = resolveConfig("esnext-server.config");
        if (rootConfig) {
            if (localConfig !== rootConfig) {
                config = mergeConfig(config, loadConfig(rootConfig));
            }
        } else {
            log.debug(`no config found in '${config.rootDir}'`);
        }
        if (localConfig) {
            config = mergeConfig(config, loadConfig(localConfig));
        } else {
            log.debug(`no config found in '${process.cwd()}'`);
        }
    }

    if (override) {
        config = mergeConfig(config, override);
    }

    if (args.module) {
        const modules = Array.isArray(args.module) ? args.module : [args.module];
        for (const module of modules) {
            config = mergeConfig(config, loadPlugin(module));
        }
    }

    if (args.debug) {
        log.level = "debug";
    } else {
        log.level = config.log.level;
    }

    log.debug("configured:", config);

    config.resolve = config.resolve || {
        paths: [path.join(config.rootDir, "node_modules")]
    };
    config.squash = config.squash || ["@babel/runtime/**","smooth-scrollbar"];

    return Object.freeze(config);
};
