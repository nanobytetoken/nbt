import { expect } from "chai";
import { ethers, network } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { beforeEach } from "mocha";
import { BigNumber, Contract, Signature,utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("NBT", () => {
  let contract: Contract;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let tom: SignerWithAddress;
  let delegator: SignerWithAddress;
  let delegatee: SignerWithAddress;
  let capped:BigNumber =ethers.utils.parseEther('10000000000');
  let firstMint:BigNumber  =ethers.utils.parseEther('5500000000');
  let secondMint:BigNumber =capped.sub(firstMint);
  
  before(async () => {
    const NBTFactory = await ethers.getContractFactory(
      "NanoByteToken"
    );
    [owner, alice, bob, tom, delegator, delegatee ] = await ethers.getSigners();
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

  it('burn should be failed execed balance', async () => {
    await expect(contract.connect(alice).burn(10000))
        .to.be.revertedWith('BEP20: burn amount exceeds balance');

    await expect(contract.connect(bob).burn(100))
        .to.be.revertedWith('BEP20: burn amount exceeds balance');
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
    let allowance = await contract.allowance(alice.address,owner.address);
    expect(allowance).to.equal(200);

    await expect(contract.burnFrom(alice.address,250))
    .to.be.revertedWith('BEP20: burn amount exceeds allowance');
   })
   
   it('burn form allowance failed not have allowance', async () => {
    let allowance = await contract.allowance(alice.address,bob.address);
    expect(allowance).to.equal(0);

    await expect(contract.connect(bob).burnFrom(alice.address,150))
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


   it("delegates on behalf of the signature", async () => {
      const nonce = (await contract.nonces(delegator.address)).toString();
      const expiry = 10e9;
      const { v, r, s } = await signDelegation(contract.address, network.config.chainId!, delegator.address, delegatee.address, nonce, expiry);
      const actualDelegationBefore = await contract.delegates(delegator.address);
      expect(actualDelegationBefore).to.equal('0x0000000000000000000000000000000000000000');
      const tx = await contract.delegateBySig(delegatee.address, nonce, expiry, v, r, s);
      const actualDelegationAfter = await contract.delegates(delegator.address);
      expect(actualDelegationAfter).to.equal(delegatee.address);

      await expect(Promise.resolve(tx))
      .to.emit(contract, 'DelegateChanged')
      .withArgs(delegator.address, '0x0000000000000000000000000000000000000000', delegatee.address);

  });
  
  it("reverts delegate signature the nonce is bad ", async () => {
    const nonce = 9;
    const expiry = 10e9;
    const { v, r, s } = await signDelegation(contract.address, network.config.chainId!, delegator.address, delegatee.address, nonce, expiry);
    await expect(contract.delegateBySig(delegatee.address, nonce, expiry, v, r, s)).to.be.revertedWith('invalid nonce');
  });

  it("transfer ownership to delegator", async () => {
    const ownerAddressBefore = await contract.owner();
    expect(ownerAddressBefore).to.equal(owner.address);

    await contract.transferOwnership(delegator.address);
    
    const ownerAddressAfter = await contract.owner();
    expect(ownerAddressAfter).to.equal(delegator.address);

  });
});

async function signDelegation(
  contractAddress:string,
  chainId: number,
  delegatorAddr: string,
  delegateeAddr: string,
  nonce: number,
  expiry: number
): Promise<Signature> {
  const EIP712Domain = {
    name: 'Nano Byte Token',
    chainId: chainId,
    verifyingContract: contractAddress,
  };
  const types = {
    Delegation: [
      { name: "delegatee", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ],
  };
  const value = { delegatee: delegateeAddr, nonce: nonce, expiry: expiry };
  const digest = utils._TypedDataEncoder.hash(EIP712Domain, types, value);
  return getSigningKey(delegatorAddr).signDigest(digest);
}

function getSigningKey(address: string): utils.SigningKey {
  const { initialIndex, count, path, mnemonic } = network.config.accounts as {
    initialIndex: number;
    count: number;
    path: string;
    mnemonic: string;
  };
  const parentNode = utils.HDNode.fromMnemonic(mnemonic).derivePath(path);
  for (let index = initialIndex; index < initialIndex + count; index++) {
    const node = parentNode.derivePath(index.toString());
    if (node.address == address) {
      return new utils.SigningKey(node.privateKey);
    }
  }
  throw `No private key found for address ${address}`;
}
