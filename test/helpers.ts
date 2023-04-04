import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import "../typechain-types";

import { config } from "../config";

export async function prepareEnv() {
    const prevEnv = await loadFixture(prepareEnvWithoutVesting);

    await prevEnv.erc20Inst.approve(
        prevEnv.vestingContractInst.address,
        config.deploy.initialSupply
    );
    const tx = await prevEnv.vestingContractInst.vestTokens();
    const block = await ethers.provider.getBlock(tx.blockNumber ?? "latest");
    const vestingTimestamp = block.timestamp;

    await time.increase(1);

    return {
        ...prevEnv,
        vestingTimestamp,
    };
}

export async function prepareEnvWithoutVesting() {
    const prepareEnv = await loadFixture(prepareEnvWithoutVestingDeployment);

    const vestingContractInst = await prepareEnv.VestingContractFactory.deploy(
        prepareEnv.tokenClaimer.address,
        prepareEnv.erc20Inst.address,
        config.deploy.initialSupply,
        config.deploy.maxAmountInMonth,
        config.deploy.firstPercent
    );

    return {
        deployer: prepareEnv.deployer,
        tokenClaimer: prepareEnv.tokenClaimer,
        user1: prepareEnv.user1,

        erc20Inst: prepareEnv.erc20Inst,
        vestingContractInst,

        oneToken: prepareEnv.oneToken,
    };
}

export async function prepareEnvWithoutVestingDeployment() {
    const [deployer, tokenClaimer, user1, ...signers] = await ethers.getSigners();

    const ERC20TestFactory = await ethers.getContractFactory("ERC20Test");
    const VestingContractFactory = await ethers.getContractFactory("VestingContractTest");

    const erc20Inst = await ERC20TestFactory.deploy();
    await erc20Inst.mint(config.deploy.initialSupply);

    const decimals = await erc20Inst.decimals();
    const oneToken = ethers.BigNumber.from(10).pow(decimals);

    return {
        erc20Inst,
        VestingContractFactory,

        deployer,
        tokenClaimer,
        user1,

        oneToken,
    };
}
