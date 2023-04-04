// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {VestingContract} from "../VestingContract.sol";

contract VestingContractTest is VestingContract {
    constructor(
        address _tokenClaimer,
        IERC20 _token,
        uint256 _amountOfTokens,
        uint256 _maxAmountInMonth,
        uint256[] memory __firstPercent
    ) VestingContract(_tokenClaimer, _token, _amountOfTokens, _maxAmountInMonth, __firstPercent) {}
}
