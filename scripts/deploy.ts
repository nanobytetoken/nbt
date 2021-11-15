import hre, {ethers} from 'hardhat';


async function main() {
  const factory = await ethers.getContractFactory("NanoByteToken");
  const contract = await factory.deploy();

  await contract.deployed().then((contract) => {
    console.log(
      `contract deployed and mined to: ${contract.address}`
    );
  });

  // verify contract
  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: [],
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