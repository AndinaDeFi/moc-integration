// Basado en https://github.com/dmernies-atix/main-RBTC-contract/blob/MCS-306-web3-integration-doc/examples/js/mintingBprox2.js

const BigNumber = require('bignumber.js');
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const Moc = require("./contracts/moc/MoC.json");
const MoCInrate = require("./contracts/moc/MoCInrate.json");
const MoCState = require("./contracts/moc/MoCState.json");
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
const mocContractAddress = "0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F";
const mocInrateAddress = "0x76790f846FAAf44cf1B2D717d0A6c5f6f5152B60";
const mocStateAddress = "0x0adb40132cB0ffcEf6ED81c26A1881e214100555";

const execute = async () => {
  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  /**
   * Transforms BigNumbers into
   * @param {BigNumber} number
   */
  const toContract = number => new BigNumber(number).toFixed(0);
  const strToBytes32 = bucket => web3.utils.asciiToHex(bucket, 32);
  const bucketX2 = 'X2';

  // Loading moc contract
  const moc = await getContract(Moc.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocInrate contract. It is necessary to compute commissions
  const mocInrate = await getContract(MoCInrate.abi, mocInrateAddress);
  if (!mocInrate) {
    throw Error('Can not find MoC Inrate contract.');
  }

  // Loading mocState contract. It is necessary to compute max BPRO available to mint
  const mocState = await getContract(MoCState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  const mintBprox2 = async btcAmount => {
    const [from] = await web3.eth.getAccounts();
    const weiAmount = web3.utils.toWei(btcAmount, 'ether');
    const btcInterestAmount = await mocInrate.methods.calcMintInterestValues(strToBytes32(bucketX2), weiAmount).call();
    const commissionValue = new BigNumber(
      await mocInrate.methods.calcCommissionValue(weiAmount).call()
    );
    const totalBtcAmount = toContract(commissionValue.plus(btcInterestAmount).plus(weiAmount));
    console.log(`Calling mint Bprox with ${btcAmount} Btcs with account: ${from}.`);

    // Gas para emular transacciones de la web
    const gas = 2000000;

    moc.methods
      .mintBProx(strToBytes32(bucketX2), weiAmount)
      .send({
        from,
        value: totalBtcAmount,
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

  const btcToMint = '0.00102';
  // Gets max BTC value available to mint BPROX2
  const maxBtcToMint = await mocState.methods.maxBProxBtcValue(strToBytes32(bucketX2)).call();

  console.log('=== Max Available RBTC to mint BPROX2: '.concat(maxBtcToMint.toString()));

  // Call mint
  await mintBprox2(btcToMint);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });