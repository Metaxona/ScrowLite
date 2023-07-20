// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Ownable.sol";

abstract contract Pausable is Ownable {
    bool public interactionPaused;

    event InteractionState(uint256 dateChanged, bool state);

    error EscrowInteractionPaused();

    function toggleCreateAndAccept() external virtual onlyOwner {
        interactionPaused = !interactionPaused;
        emit InteractionState(block.timestamp, interactionPaused);
    }

    modifier InteractionCheck {
        if(interactionPaused) revert EscrowInteractionPaused();
        _;
    }

}
