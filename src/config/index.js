"use strict";
/**
 * Configuration management for tests
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetConfig = exports.getConfigManager = exports.createConfigManager = void 0;
var ConfigManager = /** @class */ (function () {
    function ConfigManager(initialConfig) {
        this.config = {};
        this.defaults = {
            timeout: 30000,
            retries: 0,
            verbose: false,
            ci: false,
            headless: true,
        };
        this.config = __assign(__assign({}, this.defaults), initialConfig);
        this.loadEnvironmentVariables();
    }
    ConfigManager.prototype.loadEnvironmentVariables = function () {
        var env = process.env;
        var timeout = env['TEST_TIMEOUT'];
        if (timeout) {
            this.config.timeout = parseInt(timeout, 10);
        }
        var retries = env['TEST_RETRIES'];
        if (retries) {
            this.config.retries = parseInt(retries, 10);
        }
        if (env['CI']) {
            this.config.ci = true;
            this.config.headless = true;
        }
        var verbose = env['TEST_VERBOSE'];
        if (verbose) {
            this.config.verbose = verbose === 'true';
        }
        var baseUrl = env['BASE_URL'];
        if (baseUrl) {
            this.config.baseUrl = baseUrl;
        }
        var apiUrl = env['API_URL'];
        if (apiUrl) {
            this.config.apiUrl = apiUrl;
        }
        var databaseUrl = env['DATABASE_URL'];
        if (databaseUrl) {
            this.config.dbUrl = databaseUrl;
        }
    };
    ConfigManager.prototype.get = function (key) {
        return this.config[key];
    };
    ConfigManager.prototype.set = function (key, value) {
        this.config[key] = value;
    };
    ConfigManager.prototype.getAll = function () {
        return __assign({}, this.config);
    };
    ConfigManager.prototype.merge = function (partial) {
        this.config = __assign(__assign({}, this.config), partial);
    };
    ConfigManager.prototype.reset = function () {
        this.config = __assign({}, this.defaults);
    };
    return ConfigManager;
}());
var instance = null;
var createConfigManager = function (initialConfig) {
    return new ConfigManager(initialConfig);
};
exports.createConfigManager = createConfigManager;
var getConfigManager = function () {
    instance !== null && instance !== void 0 ? instance : (instance = new ConfigManager());
    return instance;
};
exports.getConfigManager = getConfigManager;
var resetConfig = function () {
    instance = null;
};
exports.resetConfig = resetConfig;
exports.default = ConfigManager;
