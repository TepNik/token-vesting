// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVestingContract {
    /* STATE VARIABLES */

    /// @notice The address that can claim tokens.
    function tokenClaimer() external view returns (address);

    /// @notice Address of the token that was vested.
    function token() external view returns (IERC20);

    /// @notice Amount of the token that was vested.
    function amountOfTokens() external view returns (uint256);

    /// @notice Maximum amount of the tokens that becomes available
    function maxAmountInMonth() external view returns (uint256);

    /// @notice Amount of the tokens that were claimed.
    function claimedAmount() external view returns (uint256);

    /// @notice Timestamp when the vesting started
    function vestingTimeStart() external view returns (uint256);

    /* FUNCTIONS */

    /// @notice Function for the `tokenClaimer` to get unfreezed tokens.
    /// @return claimedTokens Amount of the tokens the user has get
    function claim() external returns (uint256 claimedTokens);

    /// @notice Function to get amount of the tokens that can be claimed right now.
    /// @return claimableAmount Amount of the tokens that can be claimed right now
    function getClaimableAmount() external view returns (uint256 claimableAmount);

    /* OWNER FUNCTIONS */

    /// @notice Function for the owner to vest tokens. Can be called only once.
    function vestTokens() external;

    /// @notice Function for the `tokenClaimer` to set a new token claimer to the new value `newTokenClaimer`.
    /// @param newTokenClaimer A new token claimer
    function setTokenClaimer(address newTokenClaimer) external;
}
