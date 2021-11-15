/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import { task } from "hardhat/config"; 
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan";
let {
  mnemonic,
  bscscanApiKey,
  privateKey
} = require("./secrets.json");


task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

export default {
  networks: {
    testnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: [privateKey]
    },
    mainnet: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: {mnemonic: mnemonic}
    }
  },

  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://bscscan.com/
    apiKey: bscscanApiKey
  },
  solidity: "0.8.4",
};