/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import { task } from "hardhat/config"; 
import "@nomiclabs/hardhat-waffle"

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

export default {
  solidity: "0.8.4",
};