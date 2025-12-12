require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  defaultNetwork: 'ganache',
  networks: {
    hardhat: {
      chainId: 1337
    },
    ganache: {
      url: 'http://127.0.0.1:7545',
      accounts: {
        mnemonic: "use pudding swear later hint middle knee notable cloud proud elder kind",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10,
      },
      chainId: 1337,
      timeout: 60000,
      gas: 6721975,
      gasPrice: 20000000000
    },
    localhost: {
      url: 'http://127.0.0.1:7545',
      accounts: {
        mnemonic: "use pudding swear later hint middle knee notable cloud proud elder kind",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10,
      },
      chainId: 1337
    },
  },
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  mocha: {
    timeout: 20000,
  },
};