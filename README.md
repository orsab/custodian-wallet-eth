# Custodian wallet implementation

Solidity contract, that implements the custodian wallets manager managed by single account (pay gas fees, signing transactions)

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies:

```sh
git clone https://github.com/orsab/custodian-wallet-eth.git
cd custodian-wallet-eth
npm install
```

Once installed, let's run Hardhat's testing network:

```sh
npx hardhat node
```

Then, on a new terminal, go to the repository's root folder and run this to
deploy your contract:

```sh
npx hardhat run scripts/deploy.js --network localhost
```

Finally, we can run the frontend with:

```sh
cd frontend
npm install
npm start
```
