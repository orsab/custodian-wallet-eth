//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;

// We import this library to be able to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CustodianSC {
    modifier onlyOwner {
        require(msg.sender == owner, "Bad owner");
        _;
    }

    struct Balance {
        address tokenAddress;
        uint balance;
    }

    address public owner;
    uint private customerId;
    address private customerAddress;
    address[] private tokens;

    constructor(uint _customerId) {
        owner = msg.sender;
        customerId = _customerId;
    }

    /**
    * Set address for withdraw
    */
    function setCustomerAddress (uint _id, address _customerAddress) public onlyOwner {
        require(_id == customerId, "Bad customer Id supplied");
        customerAddress = _customerAddress;
    }

    /**
    * Retrieve customer address in order to find all funds
    */
    function getCustomerById(uint _id) public view onlyOwner returns(address) {
        require(_id == customerId, "Bad customer Id supplied");
        return customerAddress;
    }

    /**
    * Withdraw 
    */
    function withdraw(uint _id) public onlyOwner {
        require(_id == customerId, "Bad customer Id supplied");
        require(customerAddress != address(0), "Customer address not setted");
        
        uint i = 0;

        for(; i< tokens.length; i++){
            _withdrawForContract(tokens[i]);
        }
    }

    /**
    * Withdraw for private
    */
    function _withdrawForContract(address fromContract) private {
        IERC20 token = IERC20(fromContract);
        
        if(token.balanceOf(address(this)) > 0){
            token.transfer(customerAddress, token.balanceOf(address(this)));
        }
    }

    /**
    * Import token address
    */
    function importToken(uint _id, address fromContract) public onlyOwner {
        require(_id == customerId, "Bad customer Id supplied");
        for(uint i;i<tokens.length;i++){
            require(tokens[i] != fromContract, "Token already imported");
        }
        
        tokens.push(fromContract);
    }

    /**
    * Get balance on smart contract
    */
    function balanceOf(uint _id) public onlyOwner view returns(Balance[] memory) {
        require(_id == customerId, "Bad customer Id supplied");
        
        uint i = 0;
        Balance[] memory balances = new Balance[](tokens.length);

        for(; i< tokens.length; i++){
            IERC20 token = IERC20(tokens[i]);
            balances[i] = Balance(
                tokens[i],
                token.balanceOf(address(this))
            );
        }

        return balances;
    }


}
