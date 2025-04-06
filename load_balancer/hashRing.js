const crypto = require('crypto');
const { getNID, consistentHash, idToNum } = require('./idUtils'); // use your shared hashing utils

class HashRing {
    constructor(nodes = []) {
        // Store only node IDs (not replicas) since consistentHash doesn't need replicas
        this.nodes = nodes.map(node => getNID({ ip: node.split(':')[1].replace('//', ''), port: node.split(':')[2] }));
        this.nodeMap = new Map();
        for (let i = 0; i < nodes.length; i++) {
            const nid = this.nodes[i];
            this.nodeMap.set(nid, nodes[i]); // map NID → original URL
        }
    }

    getNode(key) {
        if (this.nodes.length === 0) return null;

        const kid = crypto.createHash('sha256').update(key).digest('hex'); // query key → hash ID
        const targetNid = consistentHash(kid, this.nodes); // pick target node ID
        return this.nodeMap.get(targetNid); // return actual node URL
    }
}

module.exports = HashRing;
