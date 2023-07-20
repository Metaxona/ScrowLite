// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SolitityTools1155 is ERC1155, Ownable {
    
    uint256 minAmount;
    uint256 maxAmount;

    error mintAmountError();

    constructor()
        ERC1155("https://ipfs.io/ipfs/QmZGtWdr5VGhnAfQWrs3TERaDxcfGHev58ndhGrri8o4ra")
    {
        minAmount = 1;
        maxAmount = 5;
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function faucetMint(uint256 id, uint256 amount, bytes memory data) public {
        if (amount > maxAmount || amount < minAmount) revert mintAmountError();

        _mint(msg.sender, id, amount, data);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }

    function setMinMax(uint256 min, uint256 max) public {
        minAmount = min;
        maxAmount = max;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }
}