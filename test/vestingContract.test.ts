import { expect } from "chai";
import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";

import {
    prepareEnv,
    prepareEnvWithoutVesting,
    prepareEnvWithoutVestingDeployment,
} from "./helpers";
import { config } from "../config";
import { ethers } from "hardhat";

import { ONE_MONTH, ONE_YEAR } from "./constants";

describe("Tests of the VestingContract contract", () => {
    describe("{constructor}", () => {
        it("Deploy test", async () => {
            const env = await loadFixture(prepareEnv);

            expect(await env.vestingContractInst.tokenClaimer()).equals(env.tokenClaimer.address);
            expect(await env.vestingContractInst.token()).equals(env.erc20Inst.address);
            expect(await env.vestingContractInst.amountOfTokens()).equals(
                config.deploy.initialSupply
            );
            expect(await env.vestingContractInst.maxAmountInMonth()).equals(
                config.deploy.maxAmountInMonth
            );
            expect(await env.vestingContractInst.claimedAmount()).equals(0);
            expect(await env.vestingContractInst.vestingTimeStart()).equals(env.vestingTimestamp);

            expect(await env.vestingContractInst.owner()).equals(env.deployer.address);

            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth.mul(config.deploy.firstPercent[0]).div(100_00)
            );
        });

        describe("Reverts", () => {
            it("Should revert in case zero values", async () => {
                const env = await loadFixture(prepareEnvWithoutVestingDeployment);

                await expect(
                    env.VestingContractFactory.deploy(
                        ethers.constants.AddressZero,
                        ethers.constants.AddressZero,
                        0,
                        0,
                        []
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "ZeroClaimer");

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        ethers.constants.AddressZero,
                        0,
                        0,
                        []
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "ZeroToken");

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        0,
                        0,
                        []
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "ZeroAmountOfTokens");

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        config.deploy.initialSupply,
                        0,
                        []
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "ZeroMaxAmountInMonth");
            });

            it("Should revert in case wrong first percent array", async () => {
                const env = await loadFixture(prepareEnvWithoutVestingDeployment);

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        config.deploy.initialSupply,
                        config.deploy.maxAmountInMonth,
                        []
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "FirstPercentLengthZero");

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        config.deploy.initialSupply,
                        config.deploy.maxAmountInMonth,
                        [100_01]
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "WrongPercent");

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        config.deploy.initialSupply,
                        config.deploy.maxAmountInMonth,
                        [0]
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "WrongPercent");
            });

            it("Should revert in case wrong {maxAmountInMonth} or {firstPercent}", async () => {
                const env = await loadFixture(prepareEnvWithoutVestingDeployment);

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        config.deploy.initialSupply,
                        100,
                        config.deploy.firstPercent
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "WrongParameters");

                await expect(
                    env.VestingContractFactory.deploy(
                        env.tokenClaimer.address,
                        env.erc20Inst.address,
                        config.deploy.initialSupply,
                        config.deploy.maxAmountInMonth,
                        [1, 1]
                    )
                ).revertedWithCustomError(env.VestingContractFactory, "WrongParameters");
            });
        });
    });

    describe("{claim} function", () => {
        it("Normal claim", async () => {
            const env = await loadFixture(prepareEnv);

            const claimableAmount = await env.vestingContractInst.getClaimableAmount();

            expect(await env.erc20Inst.balanceOf(env.tokenClaimer.address)).equals(0);

            // Check return value
            expect(
                await env.vestingContractInst.connect(env.tokenClaimer).callStatic.claim()
            ).equals(claimableAmount);

            await env.vestingContractInst.connect(env.tokenClaimer).claim();

            expect(await env.erc20Inst.balanceOf(env.tokenClaimer.address)).equals(claimableAmount);

            expect(await env.vestingContractInst.claimedAmount()).equals(claimableAmount);
        });

        it("Double claim", async () => {
            const env = await loadFixture(prepareEnv);

            await env.vestingContractInst.connect(env.tokenClaimer).claim();

            const balanceBefore = await env.erc20Inst.balanceOf(env.tokenClaimer.address);

            await env.vestingContractInst.connect(env.tokenClaimer).claim();

            expect(await env.erc20Inst.balanceOf(env.tokenClaimer.address)).equals(balanceBefore);
        });

        describe("Reverts", () => {
            it("Should revert when not allowed user", async () => {
                const env = await loadFixture(prepareEnv);

                await expect(env.vestingContractInst.connect(env.deployer).claim())
                    .revertedWithCustomError(env.vestingContractInst, "NotAllowedUser")
                    .withArgs(env.deployer.address);
            });

            it("Should revert when not vested", async () => {
                const env = await loadFixture(prepareEnvWithoutVesting);

                await expect(
                    env.vestingContractInst.connect(env.tokenClaimer).claim()
                ).revertedWithCustomError(env.vestingContractInst, "VestingNotStarted");
            });
        });
    });

    describe("{getClaimableAmount} function", async () => {
        it("Return values", async () => {
            const env = await loadFixture(prepareEnv);

            // 1-st month
            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth.mul(config.deploy.firstPercent[0]).div(100_00)
            );
            // 11-th month (end of the 1-st year)
            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_MONTH * 10);
            await mine();
            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(11)
            );
            // 13-th month (beginning of the 2-nd year)
            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_MONTH * 12);
            await mine();
            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(12)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[1])
                            .div(100_00)
                            .mul(1)
                    )
            );
            // 25-th month (beginning of the 3-rd year)
            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_MONTH * 24);
            await mine();
            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(12)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[1])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[2])
                            .div(100_00)
                            .mul(1)
                    )
            );
            // 48-th month (end of the 4-th year)
            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_MONTH * 47);
            await mine();
            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(12)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[1])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[2])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .mul(12)
                    )
            );
            // 168-th month (end of the 14-th year)
            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_MONTH * 167);
            await mine();
            expect(await env.vestingContractInst.getClaimableAmount()).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(12)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[1])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[2])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(2)
                            .mul(12)
                            .mul(4)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(4)
                            .mul(12)
                            .mul(4)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(8)
                            .mul(12)
                            .mul(2)
                    )
            );
        });

        it("Return values after claim before the end of the first percent", async () => {
            const env = await loadFixture(prepareEnv);

            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_YEAR * 2 + ONE_MONTH * 5);
            await env.vestingContractInst.connect(env.tokenClaimer).claim();

            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_YEAR * 5 + ONE_MONTH * 5);
            await mine();

            const claimedAmount = await env.vestingContractInst.claimedAmount();
            const claimableAmount = await env.vestingContractInst.getClaimableAmount();

            expect(claimedAmount).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(12)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[1])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[2])
                            .div(100_00)
                            .mul(6)
                    )
            );

            expect(claimableAmount).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[2])
                    .div(100_00)
                    .mul(6)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(2)
                            .mul(18)
                    )
            );
        });

        it("Return values after claim after the end of the first percent", async () => {
            const env = await loadFixture(prepareEnv);

            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_YEAR * 5 + ONE_MONTH * 5);
            await env.vestingContractInst.connect(env.tokenClaimer).claim();

            await time.setNextBlockTimestamp(env.vestingTimestamp + ONE_YEAR * 14);
            await mine();

            const claimedAmount = await env.vestingContractInst.claimedAmount();
            const claimableAmount = await env.vestingContractInst.getClaimableAmount();

            expect(claimedAmount).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[0])
                    .div(100_00)
                    .mul(12)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[1])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[2])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .mul(12)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(2)
                            .mul(18)
                    )
            );

            expect(claimableAmount).equals(
                config.deploy.maxAmountInMonth
                    .mul(config.deploy.firstPercent[3])
                    .div(100_00)
                    .div(2)
                    .mul(30)
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(4)
                            .mul(12)
                            .mul(4)
                    )
                    .add(
                        config.deploy.maxAmountInMonth
                            .mul(config.deploy.firstPercent[3])
                            .div(100_00)
                            .div(8)
                            .mul(25)
                    )
            );
        });

        it("In the same block as vesting", async () => {
            const env = await loadFixture(prepareEnvWithoutVesting);

            await env.erc20Inst.approve(
                env.vestingContractInst.address,
                config.deploy.initialSupply
            );
            await env.vestingContractInst.vestTokens();

            expect(await env.vestingContractInst.getClaimableAmount()).equals(0);
        });

        it("Not vested", async () => {
            const env = await loadFixture(prepareEnvWithoutVesting);

            expect(await env.vestingContractInst.getClaimableAmount()).equals(0);
        });
    });

    describe("{setTokenClaimer} function", () => {
        it("Normal set", async () => {
            const env = await loadFixture(prepareEnv);

            await env.vestingContractInst
                .connect(env.tokenClaimer)
                .setTokenClaimer(env.user1.address);

            expect(await env.vestingContractInst.tokenClaimer()).equals(env.user1.address);
        });

        describe("Reverts", () => {
            it("Should revert when no allowed user", async () => {
                const env = await loadFixture(prepareEnv);

                await expect(
                    env.vestingContractInst.connect(env.user1).setTokenClaimer(env.user1.address)
                )
                    .revertedWithCustomError(env.vestingContractInst, "NotAllowedUser")
                    .withArgs(env.user1.address);
            });
        });
    });

    describe("{vestTokens} function", () => {
        it("Normal vesting", async () => {
            const env = await loadFixture(prepareEnvWithoutVesting);

            await env.erc20Inst.approve(
                env.vestingContractInst.address,
                config.deploy.initialSupply
            );
            const tx = await env.vestingContractInst.vestTokens();

            const block = await ethers.provider.getBlock(tx.blockNumber ?? "latest");
            const vestingTimestamp = block.timestamp;

            expect(await env.vestingContractInst.vestingTimeStart()).equals(vestingTimestamp);

            expect(await env.erc20Inst.balanceOf(env.vestingContractInst.address)).equals(
                config.deploy.initialSupply
            );
        });

        describe("Reverts", () => {
            it("Should revert when not allowed user", async () => {
                const env = await loadFixture(prepareEnvWithoutVesting);

                await env.erc20Inst.transfer(env.user1.address, config.deploy.initialSupply);
                await env.erc20Inst
                    .connect(env.user1)
                    .approve(env.vestingContractInst.address, config.deploy.initialSupply);
                await expect(env.vestingContractInst.connect(env.user1).vestTokens()).revertedWith(
                    "Ownable: caller is not the owner"
                );
            });

            it("Should revert when double vesting", async () => {
                const env = await loadFixture(prepareEnv);

                await env.erc20Inst.mint(config.deploy.initialSupply);
                await env.erc20Inst.approve(
                    env.vestingContractInst.address,
                    config.deploy.initialSupply
                );
                await expect(env.vestingContractInst.vestTokens()).revertedWithCustomError(
                    env.vestingContractInst,
                    "TokensAlreadyVested"
                );
            });
        });
    });
});
