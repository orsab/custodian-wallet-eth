require("@nomiclabs/hardhat-waffle");

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
// require("./tasks/faucet");

// If you are using MetaMask, be sure to change the chainId to 1337
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: Number(process.env.HARDHAT_NETWORK_ID)
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.ROPSTEN_PRIVATE_KEY}`,`${process.env.ROPSTEN_PRIVATE_KEY}`]
    }
  }
};
