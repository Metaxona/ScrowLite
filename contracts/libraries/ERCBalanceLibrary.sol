// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
@title ERC 20, 721, 115 Balance and Allowance Check Library
@custom:library-name ERCBalance
@author Metaxona
@custom:author-url https://metaxona.com
@custom:github https://github.com/metaxona
@notice This Library Checks The Balance and Allowance Of A Specific ERC 20, 721, Or 1155 Of A Specific Owner And Operator/Spender
*/
library ERCBalance {

    /// @dev gets triggered if the Owner is not the owner of a specific NFT
    error TokenOwnerError(); 

    // ================================ BALANCE ONLY ================================

    /**
    *   @dev ERC20 Balance Check
    *   `_tokenAddress` - address of the ERC20
    *   `_owner` - address of the Owner whose balance is being checked
    *   returns uint256 value
    */
    function ERC20_Balance(address _tokenAddress, address _owner) public view returns(uint256) {
        return IERC20(_tokenAddress).balanceOf(_owner);
    }

    /**
    *   @dev ERC721 Balance Check
    *   `_tokenAddress` - address of the ERC721
    *   `_owner` - address of the Owner whose balance is being checked
    *   returns uint256 value
    */
    function ERC721_Balance(address _tokenAddress, address _owner) public view returns(uint256) {
        return IERC721(_tokenAddress).balanceOf(_owner);
    }

    /**
    *   @dev ERC1155 Balance Check
    *   `_tokenAddress` - address of the ERC1155
    *   `_owner` - address of the Owner whose balance is being checked
    *   `tokenId` - Id of the Token owned by _owner
    *   returns uint256 value
    */
    function ERC1155_Balance(address _tokenAddress, address _owner, uint256 tokenId) public view returns(uint256) {
        return IERC1155(_tokenAddress).balanceOf(_owner, tokenId);
    }

    // ================================ OWNERSHIP OF BALANCE OF A CERTAIN AMOUNT ================================
    
    /**
    *   @dev ERC20 Specified Amount Ownership Check
    *   @notice This will Check if The `_owner` owns a certain amount of Tokens
    *   `_tokenAddress` - address of the ERC20
    *   `_owner` - address of the Owner whose balance is being checked
    *   `amount` - amount of Token to be compared to the one owned by the `_owner`
    *   returns bool value
    */
    function ownsERC20Amount(address _tokenAddress, address _owner, uint256 amount) public view returns(bool) {
        return IERC20(_tokenAddress).balanceOf(_owner) >= amount;
    }

    /**
    *   @dev ERC721 Specified ERC721 Ownership Check
    *   @notice This will Check if The `_owner` owns a certain ERC721 Token
    *   `_tokenAddress` - address of the ERC721
    *   `_owner` - address of the Owner whose balance is being checked
    *   `tokenId` - token Id of the ERC721 to check that is supposed to be owned by the `_owner`
    *   returns bool value
    */
    function ownsERC721token(address _tokenAddress, address _owner, uint256 tokenId) public view returns(bool) {
        return IERC721(_tokenAddress).ownerOf(tokenId) == _owner;
    }

    /**
    *   @dev ERC1155 Specified Amount Ownership Check
    *   @notice This will Check if The `_owner` owns a certain amount of Tokens of a specific ERC1155 Token
    *   `_tokenAddress` - address of the ERC1155
    *   `_owner` - address of the Owner whose balance is being checked
    *   `tokenId` - token Id of the ERC1155 to check that is supposed to be owned by the `_owner`
    *   `amount` - amount of `TokenId` to be compared to the one owned by the `_owner`
    *   returns bool value
    */
    function ownsERC1155Amount(address _tokenAddress, address _owner, uint256 tokenId, uint256 amount) public view returns(bool) {
        return IERC1155(_tokenAddress).balanceOf(_owner, tokenId) >= amount;
    }

    // ================================ ALLOWANCE ONLY ================================

    /**
    *   @dev ERC20 Allowance Check
    *   @notice This will Check How Much Allowance The Owner Has Given To The Spender For A Specific ERC20 Token
    *   `_tokenAddress` - address of the ERC20
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `spender` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   returns uint256 value
    */
    function ERC20Allowance(address _tokenAddress, address _owner, address spender) public view returns(uint256) {
        return IERC20(_tokenAddress).allowance(_owner, spender);
    }
    
    /**
    *   @dev ERC721 Allowance Check
    *   @notice This will Check If The Owner Has Given An Approval For A Specific ERC721 Token To The Operator
    *   `_tokenAddress` - address of the ERC721
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `tokenId` - token Id of the ERC721 to check that is supposed to be owned by the `_owner`
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    *   revert error is named TokenOwnerError
    */
    function ERC721Allowance(address _tokenAddress, address operator, address _owner, uint256 tokenId) public view returns(bool) {
        if(!ownsERC721token(_tokenAddress, _owner, tokenId)) {
            revert TokenOwnerError();
        }
        return IERC721(_tokenAddress).getApproved(tokenId) == operator;
    }

    /**
    *   @dev ERC721 Allowance Check
    *   @notice This will Check If The Owner Has Given An Approval For All ERC721 Token To The Operator
    *   `_tokenAddress` - address of the ERC721
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    */
    function ERC721AllowanceAll(address _tokenAddress, address operator, address _owner) public view returns(bool) {
        return IERC721(_tokenAddress).isApprovedForAll(_owner, operator);
    }

    /**
    *   @dev ERC1155 Allowance Check
    *   @notice This will Check If The Owner Has Given An Approval For All ERC1155 Token To The Operator
    *   `_tokenAddress` - address of the ERC1155
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `tokenId` - token Id of the ERC721 to check that is supposed to be owned by the `_owner`
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    */
    function ERC1155Allowance(address _tokenAddress, address operator, address _owner) public view returns(bool) {
        return IERC1155(_tokenAddress).isApprovedForAll(_owner, operator);
    }
    
    // ================================ ALLOWANCE OF A CERTAIN AMOUNT ================================

    /**
    *   @dev ERC20 Specified Amount Allowance Check
    *   @notice This will Check How Much Allowance The Owner Has Given To The Spender For A Specific ERC20 Token
    *   `_tokenAddress` - address of the ERC20
    *   `spender` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `amount` - amount of ERC20 to be compared to the one allowed by the `_owner`
    *   returns bool value
    */
    function hasEnoughERC20Allowance(address _tokenAddress, address _owner, address spender, uint256 amount) public view returns(bool) {
        return ERC20Allowance(_tokenAddress, _owner, spender) >= amount;
    }

    /**
    *   @dev ERC721 Specified Allowance Check
    *   @notice This will Check If The Owner Has Given An Approval For All ERC721 Token To The Operator
    *   `_tokenAddress` - address of the ERC721
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `tokenId` - [use 0 if you are sure that it is approved by all] token Id of the ERC721 to check that is supposed to be owned by the `_owner`
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    *   revert error is named TokenOwnerError
    */
    function hasEnoughERC721Allowance(address _tokenAddress, address operator, address _owner, uint256 tokenId) public view returns(bool) {
        if(!ownsERC721token(_tokenAddress, _owner, tokenId)) {
            revert TokenOwnerError();
        }
        return IERC721(_tokenAddress).isApprovedForAll(_owner, operator) || IERC721(_tokenAddress).getApproved(tokenId) == operator;
    }

    /**
    *   @dev ERC1155 Specified Allowance Check
    *   @notice This will Check If The Owner Has Given An Approval For All ERC1155 Token To The Operator
    *   @notice This is The Same As The `ERC1155Allowance` Function Since A Standard ERC1155 Does Not Have Another Allowance Function Aside From isApprovedForAll 
    *   `_tokenAddress` - address of the ERC1155
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `tokenId` - token Id of the ERC1155 to check that is supposed to be owned by the `_owner`
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    */
    function hasEnoughERC1155Allowance(address _tokenAddress, address operator, address _owner) public view returns(bool) {
        return IERC1155(_tokenAddress).isApprovedForAll(_owner, operator);
    }

    // ================================ APPROVED AND HAS ENOUGH BALANCE ================================

    /**
    *   @dev ERC20 Balance And Allowance Requirements Check
    *   @notice This will Check If The Owner Has Given Enough ERC20 Token To The Spender and Has Enough ERC20 balance
    *   `_tokenAddress` - address of the ERC20
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `amount` - amount of ERC20 to be compared to the one owned by the `_owner`
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    *   revert error is named TokenOwnerError
    */
    function ERC20RequirementsTrue(address _tokenAddress, address spender, address _owner, uint256 amount) public view returns(bool) {
        return ownsERC20Amount(_tokenAddress, _owner, amount) && hasEnoughERC20Allowance(_tokenAddress, _owner, spender, amount);
    }

    /**
    *   @dev ERC721 Balance And Allowance Requirements Check
    *   @notice This will Check If The Owner Has Given An Approval For All ERC721 Token To The Operator and Has Enough ERC721 balance
    *   `_tokenAddress` - address of the ERC721
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `tokenId` - token Id of the ERC721 to check that is supposed to be owned by the `_owner`
    *   returns bool value but will revert if the `_owner` does not own any amount of the given token Id
    *   revert error is named TokenOwnerError
    */
    function ERC721RequirementsTrue(address _tokenAddress, address operator, address _owner, uint256 tokenId) public view returns(bool) {
        return ownsERC721token(_tokenAddress, _owner, tokenId) && hasEnoughERC721Allowance(_tokenAddress, operator, _owner, tokenId);
    }

    /**
    *   @dev ERC1155 Balance And Allowance Requirements Check
    *   @notice This will Check If The Owner Has Given An Approval For All ERC1155 Token To The Operator and Has Enough ERC1155 balance
    *   `_tokenAddress` - address of the ERC1155
    *   `operator` - address of the contract whose being allowed to spend a certain amount of the token in place of the `_owner`
    *   `_owner` - address of the Owner whose allowance approval is being checked
    *   `tokenId` - token Id of the ERC1155 to check that is supposed to be owned by the `_owner`
    *   `amount` - amount of `TokenId` to be compared to the one owned by the `_owner`
    *   returns bool value 
    */
    function ERC1155RequirementsTrue(address _tokenAddress, address operator, address _owner, uint256 tokenId, uint256 amount) public view returns(bool) {
        return ownsERC1155Amount(_tokenAddress, _owner, tokenId, amount) && hasEnoughERC1155Allowance(_tokenAddress, operator, _owner);
    }


}