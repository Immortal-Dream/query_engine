const { getID, consistentHash } = require('./idUtils');

class HashRing {
    constructor(nodes = [], virtualNodes = 100) {
        this.virtualNodes = virtualNodes;
        this.nidToRealNode = new Map(); // NID -> actual node address
        this.nidList = [];

        // For each real node, generate multiple virtual nodes
        for (const node of nodes) {
            for (let i = 0; i < this.virtualNodes; i++) {
                const virtualLabel = `${node}#${i}`; // eg. http://x.x.x.x:3001#42
                const nid = getID(virtualLabel);
                this.nidList.push(nid);
                this.nidToRealNode.set(nid, node);
            }
        }
    }

    getNode(key) {
        const kid = getID(key); // hash the key
        const targetNid = consistentHash(kid, this.nidList); // choose best virtual node
        return this.nidToRealNode.get(targetNid); // map back to real node
    }
}

module.exports = HashRing;
