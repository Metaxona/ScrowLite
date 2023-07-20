// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SolitityTools721 is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    uint256 minAmount;
    uint256 maxAmount;


    error mintAmountError();

    constructor() ERC721("SolidityTools721", "ST7") {
        minAmount = 1;
        maxAmount = 5;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/QmPznKeJbtMNcMdfaqxA5bBJVCikfN8gpQRcpwJwZtxMdC?=";
    }

    function faucetMint(uint256 amount) public {
        if (amount > 5 || amount < 1) revert mintAmountError();

        for (uint256 i = 0; i < amount ; i++){
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
        }
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function setMinMax(uint256 min, uint256 max) public {
        minAmount = min;
        maxAmount = max;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}