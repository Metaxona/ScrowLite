// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./extensions/Ownable.sol";
import "./extensions/Fees.sol";
import "./extensions/Pausable.sol";
import "./extensions/Withdrawable.sol";
import "./types/EscrowTypes.sol";
import "./libraries/IdGeneratorLibrary.sol";
import "./libraries/ERCBalanceLibrary.sol";

/**
@title Metaxona ERC Escrow System
@custom:contract-name Escrow
@author Metaxona
@custom:author-url https://metaxona.com 
@custom:github https://github.com/metaxona
@notice This Escrow Contract Will Enable Two Parties To Trade One ERC 20, 721, or 1155 With Each Other
In A Trustless Manner Without Worrying That Their Assets Would Be Cheated/Scammed From Them.
*/
contract Escrow is Ownable, Fees, Pausable, Withdrawable {

    mapping (bytes32 => Instance) private tradeInstance;
    mapping (address => History) private tradeHistory;

    uint256 public tradeCount;
    uint256 public pendingCount;
    uint256 public completedCount;
    uint256 public cancelledCount;
    uint256 public rejectedCount;

    event Created(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event Completed(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event Cancelled(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event Rejected(bytes32 indexed instanceId, address partyA, address partyB, AssetType from, AssetType to);
    event FeePaid(address _payer, uint256 _amount);

    error AllowanceError();
    error NotAParticipantError(address);
    error InvalidTradePramsError();
    error InteractedTradeError();
    error RequirementsNotMetError();

    /**
    @dev feeInEth is initially set to 1 * 10 ** 15 which is equivalent to 0.001 ETH = 1000000000000000
    Fee can be changed using {setFee} function located in the Fees extension
    */
    constructor() {
        owner = msg.sender;
        feeInETH = 1 * 10 ** 15; 
    }

    /**
    @custom:function-name createTrade
    @dev This Function Will Create A New Escrow Instance
   
    `_fromType` - Type of the Asset You Own And Want To Trade ERC 20, 721, or 1155
        `0` - ERC20
        `1` - ERC721
        `2` - ERC1155
    `_toType` - Type of the Asset `_partyB` Owns That You Want ERC 20, 721, or 1155
        `0` - ERC20
        `1` - ERC721
        `2` - ERC1155
    `title` - a sting describing the contents of the trade [limit to 32 characters max to save gas]
    `_partyB` - address of the target partner of the trade
    `_fromToken` - Details of The Asset [Address, Amount, Token Id] in a tuple (ERC20, ERC721, ERC1155)
    `_toToken` - Details of The Asset [Address, Amount, Token Id] in a tuple (ERC20, ERC721, ERC1155)
    expressed as an array when input is from a front end
    [
        [`ERC20 Address`, `Amount`],
        [`ERC721 Address`, `Token Id`],
        [`ERC1155 Address`, `Token Id`, `Amount`]
    ]
    */
    function createTrade(
        AssetType _fromType, 
        AssetType _toType, 
        string memory _title,
        address _partyB, 
        Assets memory _fromToken, 
        Assets memory _toToken
        ) external payable InteractionCheck hasEnoughFee partyAHasRequirements(_fromType, _fromToken) returns(bool) {
        
        address sender = msg.sender;
        uint256 blocknumber = block.number;
        uint256 timestamp = block.timestamp;

        bytes32 _id = IdGenerator.generateId(sender, _partyB, blocknumber, timestamp);

        if(tradeInstance[_id].exist || _partyB == address(0) || _partyB == sender) revert InvalidTradePramsError();

        tradeInstance[_id] = Instance({
                                        exist : true,
                                        title : _title,
                                        id : _id,
                                        status : Status.PENDING,
                                        partyA : sender,
                                        partyB : _partyB,
                                        fromType : _fromType,
                                        toType : _toType,
                                        from : _fromToken,
                                        to : _toToken,
                                        dateCreated : timestamp,
                                        isCompleted : false,
                                        isRejected : false,
                                        isCancelled : false
                                    });

        addToHistory(sender, _id); 
        addToHistory(_partyB, _id);
        
        tradeCount++;
        pendingCount++;

        emit Created(_id, sender, _partyB, tradeInstance[_id].fromType, tradeInstance[_id].toType);

        (bool success, ) = address(this).call{ value: feeInETH }("");
        require(success, "Failed To Transfer Fees!");
        
        return tradeInstance[_id].exist;
    }

    /**
    @custom:function-name acceptTrade
    @dev This Function is used for `_partyB` to Accept a Trade
    
    `_id` - Escrow Instance Id

    @dev When Audinting This Contract Using Tools Like Slither, `marker 1` and `marker 2` will trigger
    a high level security issue, with the reason that the `from` parameter is not `msg.sender`
    to prevent any further exploits regarding this part, having a permission/approval revoker 
    is required to give the users to a choice to revoke approvals for this contract as a spender.
    This is not limited to ERC20, it must be applied to other ERC Tokens too  
    */
    function acceptTrade(bytes32 _id) external InteractionCheck onlyPartyB(_id) hasNotBeenInteracted(_id) {

        if(requirementsCheck(_id) != 2) revert RequirementsNotMetError();

        Instance storage _trade = tradeInstance[_id];

        _trade.isCompleted = true;
        _trade.status = Status.COMPLETED;

        completedCount++;
        pendingCount--;

        emit Completed(_trade.id, _trade.partyA, _trade.partyB, _trade.fromType, _trade.toType);
        
        if(_trade.fromType == AssetType.ERC20) {
            /// @custom:marker 1
            require(IERC20(_trade.from.erc20.contractAddress).transferFrom(_trade.partyA, _trade.partyB, _trade.from.erc20.amount), "Failed To Transfer ERC20!");
        }
        if(_trade.fromType == AssetType.ERC721) {
            IERC721(_trade.from.erc721.contractAddress).safeTransferFrom(_trade.partyA, _trade.partyB, _trade.from.erc721.tokenId);
        }
        if(_trade.fromType == AssetType.ERC1155) {
            IERC1155(_trade.from.erc1155.contractAddress).safeTransferFrom(_trade.partyA, _trade.partyB, _trade.from.erc1155.tokenId, _trade.from.erc1155.amount, "0x0");
        }

        if(_trade.toType == AssetType.ERC20){
            /// @custom:marker 2
            require(IERC20(_trade.to.erc20.contractAddress).transferFrom(_trade.partyB, _trade.partyA, _trade.to.erc20.amount), "Failed To Transfer ERC20!");
        }
        if(_trade.toType == AssetType.ERC721) {
            IERC721(_trade.to.erc721.contractAddress).safeTransferFrom(_trade.partyB, _trade.partyA, _trade.to.erc721.tokenId);
        }
        if(_trade.toType == AssetType.ERC1155) {
            IERC1155(_trade.to.erc1155.contractAddress).safeTransferFrom(_trade.partyB, _trade.partyA, _trade.to.erc1155.tokenId, _trade.to.erc1155.amount, "0x0");
        }

    }

    /**
    @custom:function-name requirementsCheck
    @dev This Function Will Check If Conditions Are Met Or Not
   
    `_id` - Id of the Escrow Instance
    returns the following values:
    `0` - Both partyA and partyB Does Not Meet The Conditions Set In The Escrow Instance
    `1` - Only 1 Party Met The Conditions Set In The Escrow Instance
    `2` - Both Parth Met The Conditions Set In The Escrow Instance
    anything Greater Than 2 in this contract will be regarded as an Error
    */
    function requirementsCheck(bytes32 _id) private view returns(uint8 _res){
        Instance memory _trade = getEscrowById(_id); 

        if(_trade.fromType == AssetType.ERC20) {
            if(ERCBalance.ERC20RequirementsTrue(_trade.from.erc20.contractAddress, address(this), _trade.partyA, _trade.from.erc20.amount)){
                _res++;
            }
        }
        if(_trade.fromType == AssetType.ERC721) {
            if(ERCBalance.ERC721RequirementsTrue(_trade.from.erc721.contractAddress, address(this), _trade.partyA, _trade.from.erc721.tokenId)) {
                _res++;
            }
        }
        if(_trade.fromType == AssetType.ERC1155) {
            if(ERCBalance.ERC1155RequirementsTrue(_trade.from.erc1155.contractAddress, address(this), _trade.partyA, _trade.from.erc1155.tokenId, _trade.from.erc1155.amount)) {
                _res++;
            }
        }

        if(_trade.toType == AssetType.ERC20){
            if(ERCBalance.ERC20RequirementsTrue(_trade.to.erc20.contractAddress, address(this), _trade.partyB, _trade.to.erc20.amount)) {
                _res++;
            }
        }
        if(_trade.toType == AssetType.ERC721) {
            if(ERCBalance.ERC721RequirementsTrue(_trade.to.erc721.contractAddress, address(this), _trade.partyB, _trade.to.erc721.tokenId)) {
                _res++;
            }
        }
        if(_trade.toType == AssetType.ERC1155) {
            if(ERCBalance.ERC1155RequirementsTrue(_trade.to.erc1155.contractAddress, address(this), _trade.partyB, _trade.to.erc1155.tokenId, _trade.to.erc1155.amount)) {
                _res++;
            }
        }        
    }

    /**
    @custom:function-name cancelTrade
    @dev This Function is used for `_partyA` to Cancel a Trade

    `_id` - Escrow Instance Id
    */
    function cancelTrade(bytes32 _id) external onlyPartyA(_id) hasNotBeenInteracted(_id) returns(bool){
        Instance storage _trade = tradeInstance[_id];
        
        _trade.isCancelled = true;
        _trade.status = Status.CANCELLED;
        cancelledCount++;
        pendingCount--;
        emit Cancelled(_id, _trade.partyA, _trade.partyB, _trade.fromType, _trade.toType);
        return _trade.isCancelled;
    }

    /**
    @custom:function-name rejectTrade
    @dev This Function is used for `_partyB` to Reject a Trade
    
    `_id` - Escrow Instance Id
    */
    function rejectTrade(bytes32 _id) external onlyPartyB(_id) hasNotBeenInteracted(_id) returns(bool) {
        Instance storage _trade = tradeInstance[_id];
        
        _trade.isRejected = true;
        _trade.status = Status.REJECTED;
        rejectedCount++;
        pendingCount--;

        emit Rejected(_id, _trade.partyA, _trade.partyB, _trade.fromType, _trade.toType);
        return _trade.isRejected;
    }
    
    /**
    @custom:function-name getEscrowById
    @dev This Function allows one to view the details of an Escrow Instance
    using its Id
    
    `_id` - Escrow Instance Id
    */
    function getEscrowById(bytes32 _id) public view returns (Instance memory){
        Instance memory _trade = tradeInstance[_id];
        return _trade;
    }
    
    /**
    @custom:function-name getStatus
    @dev This Function allows one to view the status of an Escrow Instance

    `_id` - Escrow Instance Id
    */
    function getStatus(bytes32 _id) public view returns (Status) {
        return getEscrowById(_id).status;
    }

    /**
    @custom:function-name getHistory
    @dev This function can be used to retreive the history of a user, allowing
    one to view all `Pending`, `Completed`, `Rejected`, and `Cancelled` Instances
    of a specific user

    `_user` - address of the user whose history is being viewed
    */
    function getHistory(address _user) public view returns(bytes32[] memory){
        bytes32[] memory userTrades = tradeHistory[_user].instanceIds;
        return userTrades;
    }

    /**
    @custom:function-name addHistory
    @dev This function is used to add an Escrow Instance record to both partiipants' address
    during creation. This would allow users to create Instances targeted to users that is not
    using the application, allowing them to be a target of an Instance without requiring them
    to register first. This would make the application more user friendly and removing the need
    for an external database. 

    `_user` - address of the user whose history is being modified
    `_id` - id of the Escrow Instance being added to the `_user` history
    */
    function addToHistory(address _user, bytes32 _id) private {
        History storage _history = tradeHistory[_user];
        _history.instanceIds.push(_id);
    }

    receive() external payable {
        emit FeePaid(msg.sender, msg.value);
    }
    
    /**
    @dev This Modifier limits who could use certain functions to the `_partyA` of an Instance
    this would prevent `_partyB` from using the cancel function reserved for `_partyA`
    
    `_id` - id of the Escrow Instance
    */
    modifier onlyPartyA(bytes32 _id) {
        Instance memory _trade = getEscrowById(_id);
        if(msg.sender != _trade.partyA) revert NotAParticipantError(msg.sender);
        _;
    }
    
    /**
    @dev This Modifier limits who could use certain functions to the `_partyB` of an Instance
    this would prevent `_partyA` from using the `acccept` and `reject` function reserved for `_partyB`
    
    `_id` - id of the Escrow Instance
    */
    modifier onlyPartyB(bytes32 _id) {
        Instance memory _trade = getEscrowById(_id);
        if(msg.sender != _trade.partyB) revert NotAParticipantError(msg.sender);
        _;
    }

    /**
    @dev This Modifier Ensures That The Instance Has Not Beend Interacted With 
    To Prevent Reentrancy and Other Exploits as much as possible.

    This Modifier will prevent further interactions with the `accept`, `reject`, 
    and `cancel` functions of the Instance that has already been interacted

    `_id` - id of the Escrow Instance
    */
    modifier hasNotBeenInteracted(bytes32 _id) {
        Instance memory _trade = getEscrowById(_id);
        if(_trade.isCancelled || _trade.isRejected || _trade.isCompleted) revert InteractedTradeError();
        _;
    }

    /**
    @dev This Modifier Ensures That The User Has The Required Assets Before Being Allowed 
    To Create An Instance To Prevent Instances Being Created Without Party A Having The 
    Required Assets.

    `_fromType` - The Type Of Asset Party A Wants To Trade [ERC20, ERC721, ERC1155]
    `_fromToken` - Details of The Asset [Address, Amount, Token Id] in a tuple (ERC20, ERC721, ERC1155)
    [
        [`ERC20 Address`, `Amount`],
        [`ERC721 Address`, `Token Id`],
        [`ERC1155 Address`, `Token Id`, `Amount`]
    ]
    */
    modifier partyAHasRequirements(AssetType _fromType, Assets memory _fromToken) {
        uint8 _res;
        if(_fromType == AssetType.ERC20) {
            if(ERCBalance.ERC20RequirementsTrue(_fromToken.erc20.contractAddress, address(this), msg.sender, _fromToken.erc20.amount)){
                _res++;
            }
        }
        if(_fromType == AssetType.ERC721) {
            if(ERCBalance.ERC721RequirementsTrue(_fromToken.erc721.contractAddress, address(this), msg.sender, _fromToken.erc721.tokenId)) {
                _res++;
            }
        }
        if(_fromType == AssetType.ERC1155) {
            if(ERCBalance.ERC1155RequirementsTrue(_fromToken.erc1155.contractAddress, address(this), msg.sender, _fromToken.erc1155.tokenId, _fromToken.erc1155.amount)) {
                _res++;
            }
        }

        require(_res == 1, "Requirements Not Met!");

        _;
    }

}