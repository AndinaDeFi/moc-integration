const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require("./contracts/moc/MoC.json");
const MocState = require("./contracts/moc/MoCState.json");
const DocToken = require('./contracts/DocToken.json');
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
const docTokenAddress = '0xcb46c0ddc60d18efeb0e586c17af6ea36452dae0';
const mocAddress = '0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F';
const mocStateAddress = '0x0adb40132cB0ffcEf6ED81c26A1881e214100555';

const execute = async () => {
  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading MoC contract
  const moc = await getContract(MoC.abi, mocAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute freeDoc
  const mocState = await getContract(MocState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading DocToken contract. It is necessary to compute user balance
  const docToken = await getContract(DocToken.abi, docTokenAddress);
  if (!docToken) {
    throw Error('Can not find DocToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemFreeDoc = async docAmount => {
    const weiAmount = web3.utils.toWei(docAmount, 'ether');

    console.log(`Calling redeem Doc request, account: ${from}, amount: ${weiAmount}.`);

    // Gas para emular transacciones de la web
    const gas = 2000000;

    moc.methods
      .redeemFreeDoc(weiAmount)
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

  const docAmount = '267.53';
  const freeDoc = await mocState.methods.freeDoc().call();
  const userDocBalance = await docToken.methods.balanceOf(from).call();
  const finalDocAmount = Math.min(freeDoc, userDocBalance);
  console.log('=== Max Available DOC to redeem: ', finalDocAmount);

  // Call redeem
  await redeemFreeDoc(docAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });