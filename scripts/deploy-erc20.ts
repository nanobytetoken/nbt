import hre, {ethers} from 'hardhat';


async function main() {
  const factory = await ethers.getContractFactory("contracts/NanoByteTokenERC20.sol:NanoByteToken");
  const contract = await factory.deploy();

  await contract.deployed().then((contract) => {
    console.log(
      `contract deployed and mined to: ${contract.address}`
    );
  });

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });