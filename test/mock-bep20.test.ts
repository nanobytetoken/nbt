import { expect } from "chai";
import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { beforeEach } from "mocha";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("BEP 20 MOCK", () => {
  let contract: Contract;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let supply=ethers.utils.parseEther('1000');


  beforeEach(async () => {
    const Bep20Factory = await ethers.getContractFactory(
      "MockBEP20"
    );
    [owner, address1] = await ethers.getSigners();
    contract = await Bep20Factory.deploy(
      "Mock Bep 20",
      "MBT",
      supply
    );
  });

  it("Should set the right Total Supply", async () => {
    expect(await contract.totalSupply()).to.equal(supply);
  });

  it("Should set the right Name", async () => {
    expect(await contract.name()).to.equal("Mock Bep 20");
  });

  it("Should set the right Symbol", async () => {
    expect(await contract.symbol()).to.equal("MBT");
  });

  it("Should set the right Owner", async () => {
    expect(await contract.getOwner()).to.equal(owner.address);
  });

});
