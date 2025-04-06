const assert = require('assert');
const crypto = require('crypto');

function getID(obj) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof obj === 'string' ? obj : JSON.stringify(obj));
    return hash.digest('hex');
}

function getNID(node) {
    node = { ip: node.ip, port: node.port };
    return getID(node);
}

function idToNum(id) {
    try {
        return BigInt('0x' + id);
    } catch (err) {
        throw new Error('idToNum: id is not valid hex!');
    }
}


function consistentHash(kid, nids) {
    const kidNum = idToNum(kid);
    const ring = nids.map(nid => ({ id: nid, num: idToNum(nid) }));
    ring.push({ id: kid, num: kidNum });
    ring.sort((a, b) => (a.num < b.num ? -1 : a.num > b.num ? 1 : 0));
    const kidIndex = ring.findIndex(item => item.id === kid);
    const nextIndex = (kidIndex + 1) % ring.length;
    return ring[nextIndex].id;
}

module.exports = {
    getID,
    getNID,
    idToNum,
    consistentHash
};
