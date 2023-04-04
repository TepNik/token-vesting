import { BigNumber } from "ethers";

const decimals = 18;
const oneToken = BigNumber.from(10).pow(decimals);

export const config = {
    // global constants

    // Private key that will be used for testnets
    testnetAccounts: ["0000000000000000000000000000000000000000000000000000000000000000"],
    // Private key that will be used for mainnets
    mainnetAccounts: ["0000000000000000000000000000000000000000000000000000000000000000"],

    // Project id from https://infura.io/
    infuraIdProject: "abcd1234...",

    // API key from explorers
    // for https://etherscan.io/
    apiKeyEtherscan: "abcd1234...",
    // for https://bscscan.com/
    apiKeyBscScan: "abcd1234...",
    // for https://polygonscan.com/
    apiKeyPolygonScan: "abcd1234...",

    // API key from https://coinmarketcap.com/
    coinmarketcapApi: "abcd1234...",

    // deploy constants
    deploy: {
        token: "0x0000000000000000000000000000000000000000",
        tokenClaimer: "0x0000000000000000000000000000000000000000",
        initialSupply: oneToken.mul(700_000),
        maxAmountInMonth: oneToken.mul(10_000),
        // 100_00 - 100%
        firstPercent: [10_00, 25_00, 50_00, 100_00],
    },
};
