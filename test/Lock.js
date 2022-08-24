const {
  time,
  loadFixture,
  mine
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployLock() {
    const [owner, caller, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(5);

    return { lock, owner, caller, otherAccount };
  }

  describe("Initial State", () => {
    it("Should initialize with correct args: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);

      expect(await lock.ownerFee()).to.equal(5);
    });
  });

  describe("Lock", () => {
    it("Should lock ETHER for a while with correct args: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";

      // const RPC = "RPC_OF_THE_NETWORK";
      // const blockNumber = 1; // number of the block you want to get timestamp of
      // const provider = new ethers.providers.JsonRpcProvider(RPC)

      // const timestamp = (await provider.getBlock(blockNumber)).timestamp;

      await lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 });

      const user = await lock.locks(owner.address);

      expect(user.id).to.equal(await lock.usersNumber());
      expect(user.amountEth).to.equal(1000);
      expect(user.amountToken).to.equal(tokenAmount);
      expect(user.tokenAddress).to.equal(tokenAddress);
      // expect(user.unlockTime).to.equal(timestamp + lockTime);
      expect(user.status).to.equal(0);
      expect(await lock.usersNumber()).to.equal(1);
    });

    xit("Should lock tokens for a while with correct args: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("1000");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce";
      const user = await lock.locks(owner.address);

      await lock.lock(tokenAmount, lockTime, tokenAddress);

      expect(user.id).to.equal(await lock.usersNumber());
      expect(user.amountEth).to.equal(0);
      expect(user.amountToken).to.equal(tokenAmount);
      expect(user.tokenAddress).to.equal(tokenAddress);
      // expect(user.unlockTime).to.equal(timestamp + lockTime);
      expect(user.status).to.equal(0);
      expect(await lock.usersNumber()).to.equal(1);
    });

    it("Should emit Locked event with correct args:", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";

      await expect(lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 }))
        .to.emit(lock, 'Locked')
        .withArgs(await lock.usersNumber(), owner.address, lockTime);

    })
  });
  describe("Unlock", () => {

    it("Should transfer ETHER back after unlocking: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";

      await lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 });
      await expect(await lock.unlock(tokenAddress))
        .to.changeEtherBalances([lock, owner], [-950, 950]);
    });

    it("Should transfer ETHER back after unlocking: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";

      await lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 });
      await expect(await lock.unlock(tokenAddress))
        .to.changeEtherBalances([lock, owner], [-950, 950]);
    });


    it("Should emit UnLocked event with correct args:", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";
      await lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 });

      await expect(lock.unlock(tokenAddress))
        .to.emit(lock, 'UnLocked')
        .withArgs(await lock.usersNumber(), owner.address, lockTime);

    })

    //requires


    it("Should revert if the user didnt locked an asset before: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAddress = "0x0000000000000000000000000000000000000000";

      await expect(lock.unlock(tokenAddress))
        .to.be.revertedWith("Lock: Should have been locked to unlock");

    })
  });

  describe("Withdraw", () => {

    it("Should withdraw money with correct args: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";

      await lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 });
      await lock.unlock(tokenAddress);

      await expect(await lock.withdraw())
        .to.changeEtherBalances([lock, owner], [-50, 50]);
    })

    it("Should emit Withdrawal event with correct args:", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);
      const tokenAmount = ethers.BigNumber.from("0");
      const lockTime = ethers.BigNumber.from("10");
      const tokenAddress = "0x0000000000000000000000000000000000000000";
      await lock.lock(tokenAmount, lockTime, tokenAddress, { value: 1000 });
      await lock.unlock(tokenAddress);

      await expect(lock.withdraw())
        .to.emit(lock, 'Withdrawal')
        .withArgs(0, lockTime);
    })

    //requires
    it("Should revert if the user didnt locked an asset before: ", async () => {
      const { lock, owner, caller } = await loadFixture(deployLock);

      await expect(lock.withdraw())
        .to.be.revertedWith("You can't withdraw yet");

    })

  });


});
