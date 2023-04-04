// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IVestingContract} from "./interface/IVestingContract.sol";

contract VestingContract is Ownable, IVestingContract {
    using SafeERC20 for IERC20;

    /* STATE VARIABLES */

    /// @inheritdoc IVestingContract
    address public override tokenClaimer;

    /// @inheritdoc IVestingContract
    IERC20 public immutable override token;
    /// @inheritdoc IVestingContract
    uint256 public immutable override amountOfTokens;
    /// @inheritdoc IVestingContract
    uint256 public immutable override maxAmountInMonth;

    /// @inheritdoc IVestingContract
    uint256 public override claimedAmount;
    /// @inheritdoc IVestingContract
    uint256 public override vestingTimeStart;

    uint256 private constant _PERCENT_DENOMINATOR = 100_00;
    uint256[] private _firstPercent;
    uint256 private immutable _firstPercentLength;
    uint256 private _lastMonthCalculated;

    bool private _isTokensVested;

    /* EVENTS */

    event TokenClaimerSet(address indexed previousClaimer, address indexed newClaimer);
    event TokenVested(address indexed sender);
    event TokenClaimed(address indexed claimer, uint256 amount);

    /* ERRORS */

    error ZeroClaimer();
    error ZeroToken();
    error ZeroAmountOfTokens();
    error ZeroMaxAmountInMonth();
    error FirstPercentLengthZero();
    error WrongPercent();
    error WrongParameters();
    error TokensAlreadyVested();
    error NotAllowedUser(address user);
    error VestingNotStarted();

    constructor(
        address _tokenClaimer,
        IERC20 _token,
        uint256 _amountOfTokens,
        uint256 _maxAmountInMonth,
        uint256[] memory __firstPercent
    ) {
        if (_tokenClaimer == address(0)) revert ZeroClaimer();
        if (address(_token) == address(0)) revert ZeroToken();
        if (_amountOfTokens == 0) revert ZeroAmountOfTokens();
        if (_maxAmountInMonth == 0) revert ZeroMaxAmountInMonth();

        tokenClaimer = _tokenClaimer;

        token = _token;
        amountOfTokens = _amountOfTokens;
        maxAmountInMonth = _maxAmountInMonth;

        _firstPercentLength = __firstPercent.length;
        if (_firstPercentLength == 0) revert FirstPercentLengthZero();
        for (uint256 i = 0; i < _firstPercentLength; ++i) {
            if (__firstPercent[i] > _PERCENT_DENOMINATOR || __firstPercent[i] == 0)
                revert WrongPercent();
        }
        _firstPercent = __firstPercent;

        // Check if a user can claim all tokens. If not, set the bigger `maxAmountInMonth`
        // 1_555_200_000 = 2_592_000 * 12 * 50 = 86_400 * 30 * 12 * 50
        // 50 years
        (uint256 claimableAmount, , ) = _geClaimableAmount(
            block.timestamp,
            block.timestamp + 1_555_200_000,
            true
        );
        if (claimableAmount != _amountOfTokens) revert WrongParameters();

        emit TokenClaimerSet(address(0), _tokenClaimer);
    }

    /* EXTERNAL FUNCTIONS */

    /// @inheritdoc IVestingContract
    function claim() external override returns (uint256 claimedTokens) {
        if (msg.sender != tokenClaimer) revert NotAllowedUser(msg.sender);

        bool isTokensVested = _isTokensVested;
        if (!isTokensVested) {
            revert VestingNotStarted();
        }

        uint256 _previousClaimedAmount;
        uint256 monthNow;
        (claimedTokens, _previousClaimedAmount, monthNow) = _geClaimableAmount(
            vestingTimeStart,
            block.timestamp,
            isTokensVested
        );

        claimedAmount = _previousClaimedAmount + claimedTokens;
        _lastMonthCalculated = monthNow;

        token.safeTransfer(msg.sender, claimedTokens);

        emit TokenClaimed(msg.sender, claimedTokens);
    }

    /// @inheritdoc IVestingContract
    function getClaimableAmount() external view override returns (uint256 claimableAmount) {
        (claimableAmount, , ) = _geClaimableAmount(
            vestingTimeStart,
            block.timestamp,
            _isTokensVested
        );
    }

    /* OWNER FUNCTIONS */

    /// @inheritdoc IVestingContract
    function setTokenClaimer(address newTokenClaimer) external override {
        address prevTokenClaimer = tokenClaimer;
        if (msg.sender != prevTokenClaimer) revert NotAllowedUser(msg.sender);

        tokenClaimer = newTokenClaimer;

        emit TokenClaimerSet(prevTokenClaimer, newTokenClaimer);
    }

    /// @inheritdoc IVestingContract
    function vestTokens() external override onlyOwner {
        if (_isTokensVested) revert TokensAlreadyVested();
        _isTokensVested = true;
        vestingTimeStart = block.timestamp;

        token.safeTransferFrom(msg.sender, address(this), amountOfTokens);

        emit TokenVested(msg.sender);
    }

    /* PRIVATE FUNCITONS */

    function _geClaimableAmount(
        uint256 _vestingTimeStart,
        uint256 timestamp,
        bool isTokensVested
    ) private view returns (uint256 claimableAmount, uint256 _claimedAmount, uint256 monthNow) {
        if (timestamp <= _vestingTimeStart) {
            return (0, 0, 0);
        }
        if (!isTokensVested) {
            return (0, 0, 0);
        }

        // 1 month = 2_592_000 = 86_400 * 30 = (24 * 60 * 60) * 30
        monthNow = (timestamp - _vestingTimeStart) / 2_592_000;
        uint256 yearNow = monthNow / 12;

        uint256 lastMonthCalculated = _lastMonthCalculated;
        uint256 lastYearCalculated = lastMonthCalculated / 12;

        _claimedAmount = claimedAmount;

        uint256[] memory firstPercent;
        uint256 percentStart;
        for (
            uint256 year = lastYearCalculated;
            year <= yearNow && claimableAmount + _claimedAmount < amountOfTokens;
            ++year
        ) {
            if (year == lastYearCalculated && year < _firstPercentLength) {
                firstPercent = _firstPercent;
            }

            if (year < _firstPercentLength) {
                percentStart = firstPercent[year];
            } else {
                if (percentStart == 0) {
                    percentStart = _firstPercent[_firstPercentLength - 1];

                    percentStart /= 2 * ((year - _firstPercentLength + 3) / 4);
                }

                if ((year - _firstPercentLength) % 4 == 0) {
                    percentStart /= 2;
                }
            }

            // If percent becomes so small then end the cycle
            if (percentStart == 0) {
                break;
            }

            uint256 maxAllowedPerMonth = (percentStart * maxAmountInMonth) / _PERCENT_DENOMINATOR;

            if (year != lastYearCalculated) {
                // don't need to consider `lastMonthCalculated`
                if (year < yearNow) {
                    // [year being; ...; year end]
                    claimableAmount += maxAllowedPerMonth * 12;
                } else {
                    // [yearNow being; ...; monthNow; ...; yearNow end]
                    uint256 monthStart = year * 12;
                    claimableAmount += (monthNow - monthStart + 1) * maxAllowedPerMonth;
                }
            } else {
                // need to consider `lastMonthCalculated`

                // At the begining `lastMonthCalculated`==0 but the user didn't claimed for this month
                if (lastMonthCalculated == 0 && _claimedAmount == 0) {
                    claimableAmount += maxAllowedPerMonth;
                }

                if (year < yearNow) {
                    // [year being; ...; lastMonthCalculated; ...; year end]
                    claimableAmount += maxAllowedPerMonth * (11 - (lastMonthCalculated % 12));
                } else {
                    // [yearNow being; ...; lastMonthCalculated; ...; monthNow; ..; yearNow end]
                    claimableAmount += (monthNow - lastMonthCalculated) * maxAllowedPerMonth;
                }
            }
        }

        if (claimableAmount + _claimedAmount > amountOfTokens) {
            claimableAmount = amountOfTokens - _claimedAmount;
        }
    }
}
