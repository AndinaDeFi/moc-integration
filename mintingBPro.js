const HDWalletProvider = require("truffle-hdwallet-provider");
const BigNumber = require("bignumber.js");
const Web3 = require("web3");
//You must compile the smart contracts or use the official ABIs of the //repository
const MocAbi = require("./contracts/moc/MoC.json");
const MoCInrateAbi = require("./contracts/moc/MoCInrate.json");
const MoCStateAbi = require("./contracts/moc/MoCState.json");

//Config params to TestNet
const endpoint = "https://public-node.testnet.rsk.co";
//a mnemonic is 12 words instead of a single private key to sign the //transactions
const mnemonic =
  "chase chair crew elbow uncle awful cover asset cradle pet loud puzzle";
const provider = new HDWalletProvider(mnemonic, endpoint);
const web3 = new Web3(provider);

//Contract addresses on testnet
const mocContractAddress = "0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F";
const mocInrateAddress = "0x76790f846FAAf44cf1B2D717d0A6c5f6f5152B60";
const mocStateAddress = "0x0adb40132cB0ffcEf6ED81c26A1881e214100555";
const gasPrice = 60000000;

const execute = async () => {
  /**
   * Loads an specified contract
   * @param {json ABI} abi
   * @param {localhost/testnet/mainnet} contractAddress
   */
  const getContract = async (abi, contractAddress) =>
    new web3.eth.Contract(abi, contractAddress);

  /**
   * Transforms BigNumbers into
   * @param {*} number
   */
  const toContract = number => new BigNumber(number).toFixed(0);

  // Loading moc contract
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error("Can not find MoC contract.");
  }

  // Loading mocInrate contract. It is necessary to compute commissions
  const mocInrate = await getContract(MoCInrateAbi.abi, mocInrateAddress);
  if (!mocInrate) {
    throw Error("Can not find MoC Inrate contract.");
  }

  // Loading mocState contract. It is necessary to compute max BPRO available to mint
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error("Can not find MoCState contract.");
  }

  const mintBpro = async btcAmount => {
    web3.eth.getAccounts().then(console.log);
    const from = "0x088f4B1313D161D83B4D8A5EB90905C263ce0DbD";
    const weiAmount = web3.utils.toWei(btcAmount, "ether");
    // Computes commision value
    const commissionValue = new BigNumber(
      await mocInrate.methods.calcCommissionValue(weiAmount).call()
    );
    // Computes totalBtcAmount to call mintBpro
    const totalBtcAmount = toContract(commissionValue.plus(weiAmount));

    // Gas para emular transacciones de la web
    const gas = 2000000;

    console.log(
      `Calling Bpro minting with account: ${from} and amount: ${weiAmount}.`
    );
    const tx = moc.methods
      .mintBPro(weiAmount)
      .send({
        from,
        value: totalBtcAmount,
        gasPrice,
        gas
      }, function (
        error,
        transactionHash
      ) {
        if (error) console.log(error);
        if (transactionHash) console.log("txHash: ".concat(transactionHash));
      });

    return tx;
  };

  function logEnd() {
    console.log("End Example");
  }

  // Gets max BPRO available to mint
  const maxBproAvailable = await mocState.methods.maxMintBProAvalaible().call();
  console.log("Max Available BPRO: ".concat(maxBproAvailable.toString()));
  const btcAmount = "0.00125";

  // Call mint
  await mintBpro(btcAmount, logEnd);
};

execute()
  .then(() => console.log("Completed"))
  .catch(err => {
    console.log("Error", err);
  });