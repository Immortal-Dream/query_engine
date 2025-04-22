import crypto from 'crypto';
import {logger} from "./logger.js";

const localMap = new Map();
const EXPIRY_TIME_MS = 60 * 1000; // 1 minute in milliseconds


// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(obj));
    return hash.digest('hex');
}

/**
 * Checks if a cached entry is still valid (not expired)
 * @param {Object} cacheEntry The cache entry with timestamp
 * @return {boolean} Whether the entry is still valid
 */
function isValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    const now = Date.now();
    return (now - cacheEntry.timestamp) < EXPIRY_TIME_MS;
}

export function put(state, configuration, callback) {
    let key = configuration;
    if (!key) {
        key = getID(state);
    }

    // Store state with timestamp
    const cacheEntry = {
        data: state,
        timestamp: Date.now()
    };

    localMap.set(key, cacheEntry);
    callback(undefined, state);
}

export function get(configuration, callback) {
    let error = undefined, res = undefined;

    if (configuration === null) {
        // For listing all keys, filter out expired entries
        const validKeys = [];
        for (const key of localMap.keys()) {
            if (isValid(localMap.get(key))) {
                validKeys.push(key);
            } else {
                localMap.delete(key); // Clean up expired entry
            }
        }
        res = validKeys;
    } else {
        const cacheEntry = localMap.get(configuration);

        if (cacheEntry) {
            res = cacheEntry.data;
            if (!isValid(cacheEntry)) {
                localMap.delete(configuration); // Clean up expired entry
                logger.info('cache expired');
            }
        } else {
            error = new Error(`${configuration} doesn't exist!`);
        }
    }

    callback(error, res);
    return res;
}
export function del(configuration, callback) {
    let error = undefined, res = undefined;

    if (localMap.has(configuration)) {
        const cacheEntry = localMap.get(configuration);
        res = cacheEntry.data;
        localMap.delete(configuration);
    } else {
        error = new Error(`${configuration} doesn't exist!`);
    }

    callback(error, res);
}
