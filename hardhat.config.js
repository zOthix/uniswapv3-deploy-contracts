require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.21",
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 50,
      },
    },
  },
  networks: {
    testnet: {
      url: "http://127.0.0.1:8545", // Local Testnet RPC URL
      chainId: 31337, // Chain ID for Local Testnet
      gasPrice: 5000000000, // Gas price (wei) for transactions on Local Testnet
      accounts: [
        process.env.PRIVATE_KEY,
      ],
    },
    hardhat: {}, // Local Ethereum network
    lumioTestnet: {
      url: "https://testnet.lumio.io", // MATIC Testnet RPC URL
      chainId: 9990, // Chain ID for MATIC Testnet
      gasPrice: 5000000000, // Gas price (wei) for transactions on MATIC Testnet
      gasLimit: 30000000,
      accounts: [
        process.env.PRIVATE_KEY,
      ],
    },
  },
  typechain: {
    outDir: "contractsTypes",
  },
};
