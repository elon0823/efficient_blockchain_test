const Block = require('./block');
const cryptoHash = require('./crypto-hash')
class Blockchain {
    constructor() {
        this.chain = [];
        this.chain.push(Block.genesis());
    }

    addBlock({data}) {
        const lastBlock = this.chain[this.chain.length - 1];
        const block = Block.mineBlock({lastBlock, data});
        this.chain.push(block);
    }

    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

        for (let i=1; i<chain.length; i++) {
            const block = chain[i];
            const actualLastHash = chain[i-1].hash;
            const lastDifficulty = chain[i-1].difficulty;

            if (block.lastHash !== actualLastHash) return false;

            const validatedHash = cryptoHash(block.timestamp, block.lastHash, block.data, block.nonce, block.difficulty);

            if (block.hash !== validatedHash) return false;

            if (Math.abs(lastDifficulty - block.difficulty) > 1) {
                return false;
            }
        }
        return true;
    }

    replaceChain(chain) {
        if (chain.length <= this.chain.length) {
            console.error("The incoming chain must be longer");
            return;
        }

        if (!Blockchain.isValidChain(chain)) {
            console.error("The incoming chain must be valid");
            return;
        }

        console.log("replacing chain with", chain);
        this.chain = chain;
    }

}
module.exports = Blockchain;
