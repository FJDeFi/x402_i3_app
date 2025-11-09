// hardhat-audit.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// 强校验 NodeReal Key 是否存在（避免 undefined）
if (!process.env.NODEREAL_API_KEY) {
  console.warn("⚠️  Missing NODEREAL_API_KEY in .env, opBNB verification will fail!");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true 
    }
  },

  networks: {
    // Local dev
    hardhat: { chainId: 1337 },

    // BNB Smart Chain Mainnet
    bscmainnet: {
      url: "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      gasPrice: 3e9, // 3 gwei
      accounts: process.env.PRIVATE_KEY_MAINNET ? [process.env.PRIVATE_KEY_MAINNET] : [],
      timeout: 120000,
      confirmations: 3
    },

    // opBNB Mainnet
    opbnbmainnet: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      chainId: 204,
      gasPrice: 1e9, // 1 gwei
      accounts: process.env.PRIVATE_KEY_MAINNET ? [process.env.PRIVATE_KEY_MAINNET] : [],
      timeout: 120000,
      confirmations: 1
    }
  },

  etherscan: {
    apiKey: {
      bscmainnet: process.env.BSCSCAN_API_KEY || "",
      // NodeReal API key for opBNB
      opbnbmainnet: process.env.NODEREAL_API_KEY || ""
    },
    customChains: [
      {
        // opBNB verify 必须声明 customChains
        network: "opbnbmainnet",
        chainId: 204,
        urls: {
          apiURL: `https://open-platform.nodereal.io/${process.env.NODEREAL_API_KEY}/op-bnb-mainnet/contract/`,
          browserURL: "https://opbnbscan.com"
        }
      },
      {
        // 建议也把 bscmainnet 显式加上，保持一致
        network: "bscmainnet",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com"
        }
      }
    ]
  },

  sourcify: {
    enabled: false // 建议关闭，避免抢先验证报 "invalid address"
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 3,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },

  mocha: {
    timeout: 120000
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache", 
    artifacts: "./artifacts"
  },

  audit: {
    verificationTargets: ["I3CheckInCore", "I3Token"],
    deploymentNetworks: ["bscmainnet", "opbnbmainnet"]
  }
};
