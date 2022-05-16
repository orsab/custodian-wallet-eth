// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer, custodianManager] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const CustodianSC = await ethers.getContractFactory("CustodianSC", custodianManager);
  const Token = await ethers.getContractFactory("Token");

  const custodianSC = await CustodianSC.deploy(0);
  await custodianSC.deployed();
  console.log("CustodianSC address:", custodianSC.address);

  const munkToken = await Token.deploy('MUNK coin', 'MUNK');
  await munkToken.deployed();
  console.log("MUNK Token address:", munkToken.address);

  const punkToken = await Token.deploy('PUNK coin', 'PUNK');
  await punkToken.deployed();
  console.log("PUNK Token address:", punkToken.address);


  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(munkToken, 'Token', 'MUNK');
  saveFrontendFiles(punkToken, 'Token', 'PUNK');
  saveFrontendFiles(custodianSC, 'CustodianSC', 'CustodianSC');
}

function saveFrontendFiles(token, contract, contractName, ) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${contractName}-address.json`,
    JSON.stringify({ Token: token.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync(contract);

  fs.writeFileSync(
    contractsDir + `/${contractName}.json`,
    JSON.stringify(TokenArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
