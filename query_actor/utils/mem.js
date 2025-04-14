import crypto from 'crypto';

const localMap = new Map();

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

export function put(state, configuration, callback) {
    let key = configuration;
    if (!key) {
        key = getID(state);
    }
    localMap.set(key, state);
    callback(undefined, state);
}

export function get(configuration, callback) {
    let error = undefined, res = undefined;
    if (configuration === null) {
        res = [...localMap.keys()];
    } else if (localMap.has(configuration) || localMap.has(configuration.key)) {
        res = localMap.get(configuration) || localMap.get(configuration.key);
    } else {
        error = new Error(`${configuration} doesn't exist!`);
    }
    callback(error, res);
    return res;
}

export function del(configuration, callback) {
    let error = undefined, res = undefined;
    if (localMap.has(configuration)) {
        res = localMap.get(configuration);
        localMap.delete(configuration);
    } else {
        error = new Error(`${configuration} doesn't exist!`);
    }
    callback(error, res);
}
