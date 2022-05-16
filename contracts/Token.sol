//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;

// We import this library to be able to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


// This is the main building block for smart contracts.
contract Token is ERC20 {
    address public owner;

    function totalSupply() public pure override returns (uint256) {
        return 5 * 1e23;
    }

    /**
     * Contract initialization.
     *
     * The `constructor` is executed only once when the contract is created.
     * The `public` modifier makes a function callable from outside the contract.
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
      owner = _msgSender();
      _mint(owner, totalSupply());
    }

}
