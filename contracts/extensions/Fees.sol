// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Ownable.sol";

abstract contract Fees is Ownable {
    uint256 public feeInETH; // 0.1 ETH or 0.1 USD equivalent on Layer 2 or any low fee chains 
    event FeeChanged(uint256 newFee, uint256 dateChanged);

    error NotEnoughFeeError();

    function setFee(uint256 _newFee) external virtual  onlyOwner {
        feeInETH = _newFee;
        emit FeeChanged(_newFee, block.timestamp);
    }

    modifier hasEnoughFee {
        if(msg.value < feeInETH) revert NotEnoughFeeError();
        _;
    }
}