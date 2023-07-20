// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

abstract contract Ownable {
    address owner;

    event OwnershipTransfered(address _newOwner);

    error NotOwnerError();
    
    function transferOwnership(address newOwner) external virtual {
        require(newOwner != address(0));
        owner = newOwner;
        emit OwnershipTransfered(newOwner);
    }

    modifier onlyOwner {
        if(msg.sender != owner) revert NotOwnerError();
        _;
    }    
}