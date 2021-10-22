import { expect } from "chai";
import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { beforeEach } from "mocha";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("NBT", () => {
  let contract: Contract;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let tom: SignerWithAddress;
  let capped:BigNumber =ethers.utils.parseEther('10000000000');
  let firstMint:BigNumber  =ethers.utils.parseEther('5500000000');
  let secondMint:BigNumber =capped.sub(firstMint);
  
  before(async () => {
    const NBTFactory = await ethers.getContractFactory(
      "NanoByteToken"
    );
    [owner, alice, bob, tom] = await ethers.getSigners();
    contract = await NBTFactory.deploy();
  });

  it("Should the right cap", async () => {
    expect(await contract.cap()).to.equal(capped);
  });

  it("Should the right Name", async () => {
    expect(await contract.name()).to.equal("Nano Byte Token");
  });

  it("Should the right Symbol", async () => {
    expect(await contract.symbol()).to.equal("NBT");
  });

  it("Should the right Owner", async () => {
    expect(await contract.getOwner()).to.equal(owner.address);
  });

  it('Should be 18 decimals', async () => {
    expect(await contract.decimals()).to.equal(18);
  })

  it("Should the right total supply after min", async () => {
    // https://ethereum.stackexchange.com/a/100009
    await contract['mint(address,uint256)'](owner.address,firstMint);
    expect(await contract.totalSupply()).to.equal(firstMint);
  });

  it("Should failed : Mint over Max cap", async function(){
    await expect(contract['mint(address,uint256)'](owner.address,firstMint))
        .to.be.revertedWith('BEP20Capped: cap exceeded');
  });

  it("Should the right total supply after minting again and same with max cap", async () => {
    // https://ethereum.stackexchange.com/a/100009
    await contract['mint(address,uint256)'](owner.address,secondMint);
    expect(await contract.totalSupply()).to.equal(capped);
  });

  it("Mint over Max cap", async function(){
    await expect(contract['mint(address,uint256)'](owner.address,firstMint))
        .to.be.revertedWith('BEP20Capped: cap exceeded');
  });


  it('Should be success transfer', async () => {
    await contract.transfer(alice.address, 1000);
    expect(await contract.balanceOf(alice.address)).to.equal(1000);
  })

  it("Should failed transfer more than amount", async function(){
    await expect(contract.transfer(alice.address, capped))
        .to.be.revertedWith('BEP20: transfer amount exceeds balance');

    await expect(contract.connect(alice).transfer(bob.address, 1001))
        .to.be.revertedWith('BEP20: transfer amount exceeds balance');
  });

  it('burn should be success', async () => {
      await contract.connect(alice).burn(100);
      expect(await contract.balanceOf(alice.address)).to.equal(900);
  })

  it('approve', async () => {
    await contract.connect(alice).approve(owner.address, 100);
    let allowance = await contract.allowance(alice.address,owner.address);
    expect(allowance).to.equal(100);
   })

  it('increase allowance', async () => {
   await contract.connect(alice).increaseAllowance(owner.address, 400);
   let allowance = await contract.allowance(alice.address,owner.address);
   expect(allowance).to.equal(500);
  })
  
  it('decrease allowance', async () => {
    await contract.connect(alice).decreaseAllowance(owner.address, 300);
    let allowance = await contract.allowance(alice.address,owner.address);
    expect(allowance).to.equal(200);
   })

   it('burn form allowance failed amount exceeds allowance', async () => {
    await expect(contract.burnFrom(alice.address,250))
    .to.be.revertedWith('BEP20: burn amount exceeds allowance');
   })

   it('burn form allowance', async () => {
    await contract.burnFrom(alice.address,150);
    expect(await contract.balanceOf(alice.address)).to.equal(750);
   })

   it('allowance should be deduct after burn form', async () => {
    let allowance = await contract.allowance(alice.address,owner.address);
    expect(allowance).to.equal(50);
   })

   it('transfer form failed amount exceeds allowance', async () => {
    await expect(contract.transferFrom(alice.address,bob.address,100))
    .to.be.revertedWith('BEP20: transfer amount exceeds allowance');
   })

  
   it('should be success transfer form', async () => {
    await contract.transferFrom(alice.address,bob.address,50);
    expect(await contract.balanceOf(alice.address)).to.equal(700);
    expect(await contract.balanceOf(bob.address)).to.equal(50);
   })

   it('tom current votes shoud be same with alice balance', async () => {
    await contract.connect(alice).delegate(tom.address);
    expect(await contract.getCurrentVotes(tom.address)).to.equal(700);   
   })

   it('tom current votes shoud be deduct because alice transfer', async () => {
   await contract.connect(alice).transfer(bob.address, 200);
   expect(await contract.getCurrentVotes(tom.address)).to.equal(500);
  })

  it('bob current votes shoud be same with the balance becuase he delegate to selft address', async () => {
    await contract.connect(bob).delegate(bob.address);
    expect(await contract.getCurrentVotes(bob.address)).to.equal(250);
 
    await contract.transfer(bob.address, 100);
    expect(await contract.getCurrentVotes(bob.address)).to.equal(350);
   })

   it('tom current votes not incrase after owner transfer, because tom not doing self delegate', async () => {
    await contract.transfer(tom.address, 100);
    expect(await contract.getCurrentVotes(tom.address)).to.equal(500);
   })


});
