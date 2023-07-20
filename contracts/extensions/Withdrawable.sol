// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./Ownable.sol";

abstract contract Withdrawable is Ownable {

    error AmountExceededBalanceError();

    function withdraw() external virtual onlyOwner {
        (bool success, ) = payable(owner).call{ value: address(this).balance }("");
        require (success, "Withdraw Error");
    }
    
    function withdrawAmount(uint256 _amount) external virtual onlyOwner {

        if(_amount > address(this).balance) revert AmountExceededBalanceError(); 
        
        (bool success, ) = payable(owner).call{ value: _amount }("");
        require (success, "Withdraw Error");
    }

    function withdrawERC20(address receiver, address tokenAddress, uint256 amount) external virtual onlyOwner returns(bool){
        return IERC20(tokenAddress).transfer(receiver, amount);
    }
    
    function withdrawERC721(address receiver, address nftAddress, uint256 tokenId) external virtual onlyOwner {
        IERC721(nftAddress).safeTransferFrom(address(this), receiver, tokenId);

    }

    function withdrawERC1155(address receiver, address nftAddress, uint256 tokenId, uint256 amount) external virtual onlyOwner {
        IERC1155(nftAddress).safeTransferFrom(address(this), receiver, tokenId, amount, "0x0");
    }
}