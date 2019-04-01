const Config = require("../config");
const { ec } = require("../util");
const cryptoHash = require("../util/crypto-hash");
const Transaction = require('./transaction');

class Wallet {
    
    constructor() {
        this.balance = Config.STARTING_BALANCE;
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
    }
    createTransaction({amount, recipient}) {
        console.log(amount, this.balance);
        if (amount > this.balance){
            throw new Error('Amount exceeds balance');
        }

        return new Transaction({senderWallet:this, recipient, amount });
    }
}

module.exports = Wallet;