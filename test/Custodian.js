// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");

let Custodian;
  let Token;
  let hardhatToken;
  let owner;
  let custodianManager;
  let addr2;
  let addrs;
  const nameToken = 'MUNK coin'
  const symbolToken = 'MUNK'

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, custodianManager, addr2, ...addrs] = await ethers.getSigners();
    Token = await ethers.getContractFactory("Token");
    Custodian = await ethers.getContractFactory("CustodianSC", custodianManager);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    hardhatToken = await Token.deploy(nameToken, symbolToken);

    // We can interact with the contract by calling `hardhatToken.method()`
    await hardhatToken.deployed();
  });

describe("Custodian contract", function () {
  let custodian
  const address = '0xB3b810dfAFbfCF9d86F7dd8D36f200e984839249'

  beforeEach(async ()=>{
    custodian = await Custodian.deploy(3, address);
  })

  // You can nest describe calls to create subsections.
  it("Create custodian", async function () {
    await custodian.deployed()
    const addr = await custodian.getCustomerById(3)

    expect(addr == address)
  });

  it("Create check transaction", async function () {
    await custodian.importToken(3, hardhatToken.address);
    await hardhatToken.transfer(custodian.address, '10')
    const balance = await hardhatToken.balanceOf(custodian.address)
    const balance2 = await custodian.balanceOf(3)

    expect(balance).to.eq('10')
    expect(balance2.find(b => b.tokenAddress === hardhatToken.address).balance).to.eq('10')

  })

  it("After withdraw should update balances", async function () {
    await custodian.importToken(3, hardhatToken.address);
    await hardhatToken.transfer(custodian.address, '10')
    await custodian.withdraw(3)

    const balance3 = await hardhatToken.balanceOf(custodian.address)
    const balance4 = await hardhatToken.balanceOf(address)

    expect(balance3).to.eq('0')
    expect(balance4).to.eq('10')
  })

  it("Should be reverted if someone do transfer", async function () {
    await custodian.importToken(3, hardhatToken.address);
    await hardhatToken.transfer(custodian.address, '10')

    expect(custodian.connect(addr2).withdraw(3)).to.be.revertedWith('Bad owner')
  })
  
  it("Should view balance after import token", async function () {
    await custodian.importToken(3, hardhatToken.address);
    
    expect(custodian.importToken(3, hardhatToken.address)).to.be.revertedWith('Token already imported')
  })

});
