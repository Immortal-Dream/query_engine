const crypto = require('crypto');

function getID(obj) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof obj === 'string' ? obj : JSON.stringify(obj));
    return hash.digest('hex');
}

function idToNum(id) {
    try {
        return BigInt('0x' + id);
    } catch (err) {
        throw new Error('idToNum: id is not valid hex!');
    }
}

// classic consistent hashing: find the first node clockwise after the key
function consistentHash(kid, nids) {
    const kidNum = idToNum(kid);
    const ring = nids.map(nid => ({
        id: nid,
        num: idToNum(nid)
    }));
    ring.push({id: kid, num: kidNum});

    ring.sort((a, b) => (a.num < b.num ? -1 : a.num > b.num ? 1 : 0));

    const kidIndex = ring.findIndex(item => item.id === kid);
    const nextIndex = (kidIndex + 1) % ring.length;

    return ring[nextIndex].id;
}

module.exports = {
    getID,
    idToNum,
    consistentHash
};
