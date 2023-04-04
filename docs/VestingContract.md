# Solidity API

## VestingContract

### tokenClaimer

```solidity
address tokenClaimer
```

The address that can claim tokens.

### token

```solidity
contract IERC20 token
```

Address of the token that was vested.

### amountOfTokens

```solidity
uint256 amountOfTokens
```

Amount of the token that was vested.

### maxAmountInMonth

```solidity
uint256 maxAmountInMonth
```

Maximum amount of the tokens that becomes available

### claimedAmount

```solidity
uint256 claimedAmount
```

Amount of the tokens that were claimed.

### vestingTimeStart

```solidity
uint256 vestingTimeStart
```

Timestamp when the vesting started

### TokenClaimerSet

```solidity
event TokenClaimerSet(address previousClaimer, address newClaimer)
```

### TokenVested

```solidity
event TokenVested(address sender)
```

### TokenClaimed

```solidity
event TokenClaimed(address claimer, uint256 amount)
```

### ZeroClaimer

```solidity
error ZeroClaimer()
```

### ZeroToken

```solidity
error ZeroToken()
```

### ZeroAmountOfTokens

```solidity
error ZeroAmountOfTokens()
```

### ZeroMaxAmountInMonth

```solidity
error ZeroMaxAmountInMonth()
```

### FirstPercentLengthZero

```solidity
error FirstPercentLengthZero()
```

### WrongPercent

```solidity
error WrongPercent()
```

### WrongParameters

```solidity
error WrongParameters()
```

### TokensAlreadyVested

```solidity
error TokensAlreadyVested()
```

### NotAllowedUser

```solidity
error NotAllowedUser(address user)
```

### VestingNotStarted

```solidity
error VestingNotStarted()
```

### constructor

```solidity
constructor(address _tokenClaimer, contract IERC20 _token, uint256 _amountOfTokens, uint256 _maxAmountInMonth, uint256[] __firstPercent) public
```

### claim

```solidity
function claim() external returns (uint256 claimedTokens)
```

Function for the `tokenClaimer` to get unfreezed tokens.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| claimedTokens | uint256 | Amount of the tokens the user has get |

### getClaimableAmount

```solidity
function getClaimableAmount() external view returns (uint256 claimableAmount)
```

Function to get amount of the tokens that can be claimed right now.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| claimableAmount | uint256 | Amount of the tokens that can be claimed right now |

### setTokenClaimer

```solidity
function setTokenClaimer(address newTokenClaimer) external
```

Function for the `tokenClaimer` to set a new token claimer to the new value `newTokenClaimer`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newTokenClaimer | address | A new token claimer |

### vestTokens

```solidity
function vestTokens() external
```

Function for the owner to vest tokens. Can be called only once.

