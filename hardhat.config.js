require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "localhost",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // Sepolia RPC
      accounts: [process.env.TEST_PRIVATE_KEY] // Test wallet with Native Token For Deployment 
    },
    // goerli: {url: "", accounts : []},
    // polygonMumbai: {url: "", accounts : []},
    // arbitrumGoerli: {url: "", accounts : []},
    // optimismGoerli: {url: "", accounts : []},
    // add otehr networks here following the format of sepolia for deploying on other chains using hardhat
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY // Etherscan API Key
    }
  }
};
