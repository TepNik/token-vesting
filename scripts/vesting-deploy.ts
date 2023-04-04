import { ethers } from "hardhat";

import { config } from "../config";
import { deployAndVerify } from "./utils";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    await deployAndVerify("VestingContract", [
        config.deploy.tokenClaimer,
        config.deploy.token,
        config.deploy.initialSupply,
        config.deploy.maxAmountInMonth,
        config.deploy.firstPercent,
    ]);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
