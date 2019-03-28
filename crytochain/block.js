const {GENESIS_DATA, MINE_RATE} = require('./config')
const cryptoHash = require('./crypto-hash');
const hexToBinary = require('hex-to-binary');

class Block {
	constructor({timestamp, lastHash, hash, data, nonce, difficulty}) {
    	this.timestamp = timestamp;
		this.data = data;
		this.hash = hash;
		this.lastHash = lastHash;
		this.nonce = nonce;
		this.difficulty = difficulty;
	}
	static genesis() {
		return new this(GENESIS_DATA)
	}
	static mineBlock({lastBlock, data}) {
		let hash, timestamp;
		const lastHash = lastBlock.hash;
		let nonce = 0;
		let difficulty = lastBlock.difficulty;

		do {
			nonce++;
			timestamp = Date.now();

			difficulty = Block.adjustDifficulty({originalBlock: lastBlock, timestamp});
			hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

		} while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

		return new this({
			timestamp:timestamp,
			lastHash:lastHash,
			hash: cryptoHash(timestamp, lastHash, data, nonce, difficulty),
			difficulty: difficulty,
			nonce: nonce,
			data:data
		});
	}
	static adjustDifficulty({originalBlock, timestamp}) {
		const { difficulty } = originalBlock;
		if(difficulty < 1) {
			return 1;
		}
		const difference = timestamp - originalBlock.timestamp;

		if (difference > MINE_RATE) return difficulty - 1;

		return difficulty + 1;
	}
}

module.exports = Block;
