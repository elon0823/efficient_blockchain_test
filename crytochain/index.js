const express = require("express");
const request = require('request');
const Blockchain = require('./blockchain/blockchain');
const bodyParser = require("body-parser");
const TransactionPool = require('./wallet/transaction-pool');
const PubSub = require("./app/pubsub");
const Wallet = require('./wallet/wallet');

const app = express();
const blockchain = new Blockchain();
let transactionPool = new TransactionPool();
const wallet = new Wallet();
const pupsub = new PubSub({blockchain, transactionPool});
const DEFAULT_PORT = 3000;
let PEER_PORT;

const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

app.use(bodyParser.json());

app.get("/api/blocks", (req, res) => {
    res.json(blockchain.chain);

});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock({data});

    pupsub.broadcastChain();

    res.redirect("/api/blocks");
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;
    let transaction = transactionPool.existingTransaction({ inputAddress:wallet.publicKey });
    try {
        if (transaction) {
            transaction.update({senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ recipient, amount });   
        }
        transactionPool.setTransaction(transaction);
        pupsub.broadcaseTransaction(transaction);

        res.json({ type:'success', transaction });
    }
    catch (error) {
        res.status(400).json({ type: 'error', message: error.message });
    }
});
app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

const syncChains = () => {
    request({url: `${ROOT_NODE_ADDRESS}/API/blocks`}, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });
};

const syncTransactionPool = () => {
    request({url: `${ROOT_NODE_ADDRESS}/API/transaction-pool-map`}, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);

            console.log('replace transactionpool on a sync with', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
};

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random()*1000); 
}
const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);

    if (PORT !== DEFAULT_PORT) {
        syncChains();
        syncTransactionPool();
    }
});
