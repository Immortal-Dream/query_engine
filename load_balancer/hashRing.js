const { getID, consistentHash } = require('./idUtils');

class HashRing {
    constructor(nodes = []) {
        this.nidToRealNode = new Map(); // NID -> actual node address
        this.nidList = [];

        for (const node of nodes) {
            const address = node.address;
            const virtualCount = node.weight || 100;

            for (let i = 0; i < virtualCount; i++) {
                const virtualLabel = `${address}#${i}`;
                const nid = getID(virtualLabel);
                this.nidList.push(nid);
                this.nidToRealNode.set(nid, address);
            }
        }
    }

    getNode(key) {
        const kid = getID(key);
        const targetNid = consistentHash(kid, this.nidList);
        return this.nidToRealNode.get(targetNid);
    }
}

module.exports = HashRing;
