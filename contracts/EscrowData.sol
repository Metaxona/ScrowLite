// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./types/EscrowTypes.sol";
import "./extensions/Ownable.sol";

interface IEscrow {

    event Created(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event Completed(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event Cancelled(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event Rejected(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event FeePaid(address _payer, uint256 _amount);

    function createTrade(
        AssetType _fromType, 
        AssetType _toType, 
        string memory _title,
        address _partyB, 
        Assets memory _fromToken, 
        Assets memory _toToken
        ) external payable returns(bool);

    function acceptTrade(bytes32 _id) external;

    function cancelTrade(bytes32 _id) external;

    function rejectTrade(bytes32 _id) external returns(bool);

    function getEscrowById(bytes32 _id) external view returns (Instance memory);

    function getStatus(bytes32 _id) external view returns (Status);

    function getHistory(address _user) external view returns(bytes32[] memory);

}

contract EscrowData is Ownable {

    address public escrowContract;

    constructor(address _escrowContract){
        owner = msg.sender;
        escrowContract = _escrowContract;
    }

    /**
    @custom:function-name getExpandedHistory
    @dev This function is used to retreive the expanded version of a user's trade
    history as opposed to `getHistory` which only returns a list of ids

    `_user` - address of the user whose expanded history is being viewed
    */
    function getExpandedHistory(address _user) external view returns(Instance[] memory) {
        bytes32[] memory _ids = IEscrow(escrowContract).getHistory(_user);
        
        Instance[] memory _tradeList = new Instance[](_ids.length);

        for(uint256 i = 0; i < _ids.length ; i++){
            _tradeList[i] = IEscrow(escrowContract).getEscrowById(_ids[i]);
        }

        return _tradeList;
    }

    function setEscrowContractAddress(address _newEscrow) external onlyOwner {
        escrowContract = _newEscrow;
    }
}