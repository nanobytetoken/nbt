import hre, {ethers} from 'hardhat';

const maxSupply = 10000000;
const decimalPlaces = 18;

async function main() {
  const factory = await ethers.getContractFactory("NanoByteToken");
  const contract = await factory.deploy(ethers.utils.parseUnits(maxSupply.toString(), decimalPlaces));

  await contract.deployed().then((contract) => {
    console.log(
      `contract deployed and mined to: ${contract.address}`
    );
  });

  // verify contract
  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: [ethers.utils.parseUnits(maxSupply.toString(), decimalPlaces)],
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