// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

enum Status { PENDING, COMPLETED, CANCELLED, REJECTED }
enum AssetType { ERC20, ERC721, ERC1155 }

struct ERC20Info {
    /// cannot be a zero address and must be of the said type of Contract and not an EOA
    address contractAddress; 
    uint256 amount;
}

struct ERC721Info {
    /// cannot be a zero address and must be of the said type of Contract and not an EOA
    address contractAddress; 
    uint256 tokenId;
}

struct ERC1155Info {
    /// cannot be a zero address and must be of the said type of Contract and not an EOA
    address contractAddress;
    uint256 tokenId;
    uint256 amount;
}

struct Assets {
    ERC20Info erc20;
    ERC721Info erc721;
    ERC1155Info erc1155;
}

struct Instance {
    bool exist;
    string title;
	bytes32 id;
	Status status;
	address partyA;
	address partyB;
    AssetType fromType;
    AssetType toType;
	Assets from; 
	Assets to;
	uint256 dateCreated;
    bool isCompleted;
	bool isRejected;
	bool isCancelled;
}

struct History {
    address user;
    bytes32[] instanceIds;
}

struct AssetData {
    AssetType _type;
    address contractAddress;
    uint256 _id;
    uint256 amount;
}

// to use get the from and check the AssetType first then use the appropriate values after
struct Instance_Test {
    bool exist;
    string title;
	bytes32 id;
	Status status;
	address partyA;
	address partyB;
	AssetData from; 
	AssetData to;
	uint256 dateCreated;
    bool isCompleted;
	bool isRejected;
	bool isCancelled;
}

// to use get the from and check the AssetType first then use the appropriate values after
// loop the from and to data and check if the crates has those assets
struct Instance_Test_2 {
    bool exist;
    string title;
	bytes32 id;
	Status status;
	address partyA;
	address partyB;
	AssetData[] from; 
	AssetData[] to;
	uint256 dateCreated;
    bool isCompleted;
	bool isRejected;
	bool isCancelled;
}