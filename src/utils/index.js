"use strict";
/**
 * Common utility functions for testing
 * Note: Async utilities (retry, sleep, waitUntil, createDeferred) are in ./async/index.ts
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
exports.deepClone = deepClone;
exports.deepMerge = deepMerge;
exports.sanitizeForLogging = sanitizeForLogging;
/**
 * Deep clone an object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(function (item) { return deepClone(item); });
    }
    if (obj instanceof Object) {
        var clonedObj = {};
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
}
/**
 * Merge two objects deeply
 */
function deepMerge(target, source) {
    var result = __assign({}, target);
    for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            var sourceValue = source[key];
            var targetValue = result[key];
            if (typeof sourceValue === 'object' &&
                sourceValue !== null &&
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(sourceValue) &&
                !Array.isArray(targetValue)) {
                result[key] = deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
    }
    return result;
}
/**
 * Sanitize data for logging (removes sensitive info)
 * Uses @kitiumai/logger's sanitizeData function
 */
var logger_1 = require("@kitiumai/logger");
function sanitizeForLogging(data, sensitiveKeys) {
    if (sensitiveKeys === void 0) { sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']; }
    return (0, logger_1.sanitizeData)(data, sensitiveKeys);
}
