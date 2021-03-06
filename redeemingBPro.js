const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MocAbi = require("./contracts/moc/MoC.json");
const MoCInrateAbi = require("./contracts/moc/MoCInrate.json");
const MoCStateAbi = require("./contracts/moc/MoCState.json");
const BProTokenAbi = require('./contracts/BProToken.json');
const truffleConfig = require('./truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocContractAddress = '0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F';
const mocInrateAddress = '0x76790f846FAAf44cf1B2D717d0A6c5f6f5152B60';
const mocStateAddress = '0x0adb40132cB0ffcEf6ED81c26A1881e214100555';
const bproTokenAddress = '0x4dA7997A819bb46B6758B9102234c289dD2Ad3bf';

const execute = async () => {
  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading moc contract
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocInrate contract. It is necessary to compute commissions
  const mocInrate = await getContract(MoCInrateAbi.abi, mocInrateAddress);
  if (!mocInrate) {
    throw Error('Can not find MoC Inrate contract.');
  }

  // Loading mocState contract. It is necessary to compute absolute max BPRO
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading BProToken contract. It is necessary to compute user balance
  const bproToken = await getContract(BProTokenAbi.abi, bproTokenAddress);

  const [from] = await web3.eth.getAccounts();

  const redeemBpro = async bproAmount => {
    const weiAmount = web3.utils.toWei(bproAmount, 'ether');

    // Gas para emular transacciones de la web
    const gas = 2000000;

    console.log(`Calling redeem Bpro with account: ${from} and amount: ${weiAmount}.`);
    moc.methods
      .redeemBPro(weiAmount)
      .send({
        from,
        gasPrice,
        gas
      }, function (error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function (hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function (receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  const getAbsoluteMaxBpro = await mocState.methods.absoluteMaxBPro().call();
  const userAmount = await bproToken.methods.balanceOf(from).call();
  const bproFinalAmount = Math.min(userAmount, getAbsoluteMaxBpro);
  console.log('=== Max amount of BPro to redeem: ', bproFinalAmount);

  const bproAmount = '0.00103';

  // Call redeem
  await redeemBpro(bproAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });