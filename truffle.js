const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic =
  process.env.MNEMONIC || "filter yard prison quality subject engage exhibit zebra divert picnic spread crystal";
// process.env.MNEMONIC || "chase chair crew elbow uncle awful cover asset cradle pet loud puzzle";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  compilers: {
    solc: {
      version: '0.5.8',
      evmVersion: 'byzantium',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
      }
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      endpoint: 'http://127.0.0.1:8545',
      network_id: '*',
      gas: 6721975,
      gasPrice: 20000000000
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    rskTestnet: {
      host: 'https://public-node.testnet.rsk.co',
      provider: new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co'),
      network_id: '*',
      gasPrice: 60000000
    }
  },
  mocha: {
    useColors: true,
    bail: true
  }
};