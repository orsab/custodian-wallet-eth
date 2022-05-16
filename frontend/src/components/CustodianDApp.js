import React, { useCallback, useEffect, useState } from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers, ContractFactory } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import MUNKArtifact from "../contracts/MUNK.json";
import PUNKArtifact from "../contracts/PUNK.json";
import MUNKAddress from "../contracts/MUNK-address.json";
import PUNKAddress from "../contracts/PUNK-address.json";
import CustodianArtifact from "../contracts/CustodianSC.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";

// This is the Hardhat Network id, you might change it in the hardhat.config.js.
// If you are using MetaMask, be sure to change the Network id to 1337.
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
// const HARDHAT_NETWORK_ID = '1337';
const HARDHAT_NETWORK_ID = "31337";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
const initialState = {
  tokenData: undefined,
  selectedAddress: undefined,
  balance: undefined,
  txBeingSent: undefined,
  transactionError: undefined,
  networkError: undefined,
  tokens:[],
  PUNK:0,
  MUNK:0,
};

const tokens = [{token:'MUNK',tokenAddress:MUNKAddress.Token},{token:'PUNK',tokenAddress:PUNKAddress.Token}]

const CustodianDApp = () => {
  const [state, setState] = useState(initialState);
  const [_provider, setProvider] = useState(null);
  const [_pollDataInterval, setPollDataInterval] = useState(null);
  const [input, setInput] = useState({ id: "", address: "",token:"" });
  const [custodians, setCustodians] = useState([]);
  const [transferState, setTransferState] = useState({});

  const _dismissNetworkError = useCallback(() => {
    setState((state) => ({ ...state, networkError: undefined }));
  }, []);

  const _initialize = (userAddress) => {
    const _custodians = window.localStorage.getItem("data");
    setCustodians(_custodians ? JSON.parse(_custodians) : []);

    setState((state) => ({ ...state, selectedAddress: userAddress }));

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    // // Then, we initialize the contract using that provider and the token's
    // // artifact. You can do this same thing with your contracts.
    // const MUNKToken = new ethers.Contract(
    //   MUNKAddress.Token,
    //   MUNKArtifact.abi,
    //   provider.getSigner(0)
    // );
    // const PUNKToken = new ethers.Contract(
    //   PUNKAddress.Token,
    //   PUNKArtifact.abi,
    //   provider.getSigner(0)
    // );

  };

  useEffect(() => {
    if(!_provider){
      return
    }
    setPollDataInterval(
      setInterval(() => {
        _updateBalance();
      }, 1000)
    );
  }, [_provider]);

  const _stopPollingData = useCallback(() => {
    clearInterval(_pollDataInterval);
    _pollDataInterval = undefined;
  }, [_pollDataInterval]);

  const _updateBalance = async () => {
    const rawData = window.localStorage.getItem("data")
    const _custodians = rawData ? JSON.parse(rawData) : [];



    const MUNKToken = new ethers.Contract(
      MUNKAddress.Token,
      MUNKArtifact.abi,
      _provider.getSigner(0)
    )
    const PUNKToken = new ethers.Contract(
      PUNKAddress.Token,
      PUNKArtifact.abi,
      _provider.getSigner(0)
    )

    const [munkCount, punkCount] = await Promise.all([MUNKToken.balanceOf(state.selectedAddress),PUNKToken.balanceOf(state.selectedAddress)])
    setState({
      ...state,
      MUNK:munkCount,
      PUNK:punkCount
    })

    for (const custodian of _custodians) {
      if (!custodian.contractAddress) {
        continue;
      }

      const Token = new ethers.Contract(
        custodian.contractAddress,
        CustodianArtifact.abi,
        _provider.getSigner(0)
      )

      // await Token.importToken(custodian.id, state.tokens[0].address);
      const balances = await Token.balanceOf(custodian.id);
      
      custodian.balances = balances.map(b => ({
        balance: b.balance.toString(),
        token: tokens.find(t => t.tokenAddress == b.tokenAddress)?.token || ''
      }))

      console.log(custodian.balances)
    }
    setCustodians(_custodians);
    window.localStorage.setItem("data", JSON.stringify(_custodians));
  }

  const _resetState = () => {
    setState(initialState);
  };

  // This method checks if Metamask selected network is Localhost:8545
  const _checkNetwork = useCallback(() => {
    if (window.ethereum.networkVersion === process.env.HARDHAT_NETWORK_ID) {
      return true;
    }

    setState({
      ...state,
      networkError: "Please connect Metamask to Localhost:8545",
    });

    return false;
  }, []);

  const _connectWallet = useCallback(async () => {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (!_checkNetwork()) {
      return;
    }

    _initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      _stopPollingData();
      if (newAddress === undefined) {
        return _resetState();
      }

      _initialize(newAddress);
    });

    window.ethereum.on("chainChanged", ([networkId]) => {
      _stopPollingData();
      _resetState();
    });
  }, []);

  const addCustodian = async (e) => {
    const newCustodian = {
      id: input.id,
      address: input.address,
      contractAddress: "",
      balance: [],
    };
    const factory = new ContractFactory(
      CustodianArtifact.abi,
      CustodianArtifact.bytecode,
      _provider.getSigner(0)
    );
    const contract = await factory.deploy(
      newCustodian.id,
      newCustodian.address
    );
    await contract.deployed();
    newCustodian.contractAddress = contract.address;

    custodians.push(newCustodian);
    setCustodians(custodians);
    window.localStorage.setItem("data", JSON.stringify(custodians));
  };
  const deleteCustodian = _c => (e) => {
    const filtered = custodians.filter(c => c.id !== _c.id)
    window.localStorage.setItem("data", JSON.stringify(filtered));
    setCustodians(filtered)
  }
  const resetTable = (e) => {
    setCustodians([]);
    window.localStorage.setItem("data", JSON.stringify([]));
  };

  const onInputChange = (field) => (e) => {
    e.persist();

    setInput((state) => ({ ...state, [field]: e.target.value }));
  };
  const onSelectToken = custodian => async (e) => {
    if(!input.token){
      return
    }
    const custodianWallet = new ethers.Contract(
      custodian.contractAddress,
      CustodianArtifact.abi,
      _provider.getSigner(0)
    );

    await custodianWallet.importToken(custodian.id, input.token)
  };


  const onWithdraw = (custodian) => async e => {
    const custodianContract = new ethers.Contract(
      custodian.contractAddress,
      CustodianArtifact.abi,
      _provider.getSigner(0)
    )

    await custodianContract.withdraw(custodian.id)
  }

  const setTransfer = (fromToken, field) => e => {
    setTransferState({...transferState, fromToken, [field]:e.target.value})
  }

  const onSendTransaction = async () => {
    const token = new ethers.Contract(
      transferState.fromToken,
      MUNKArtifact.abi,
      _provider.getSigner(0)
    )

    await token.transfer(transferState.toAddress, transferState.amount)
  }

  if (window.ethereum === undefined) {
    return <NoWalletDetected />;
  }

  if (!state.selectedAddress) {
    return (
      <ConnectWallet
        connectWallet={_connectWallet}
        networkError={state.networkError}
        dismiss={_dismissNetworkError}
      />
    );
  }
  if (!custodians) {
    return <Loading />;
  }

  return (
    <div className="container p-4">
      <div className="row">
        <div className="col-12">
          <h1>Custodian wallet Demo Page</h1>
          <p>
            connected as <b>{state.selectedAddress}</b> Balance: <b>MUNK:{state.MUNK.toString()}</b> <b>PUNK:{state.PUNK.toString()}</b>
          </p>
          {tokens.map((t,key) => (
            <p key={key}>
              <div className="row">
                <b>
                  {t.token}: {t.tokenAddress}
                </b>
                <div className="col-2">
                <input className="form-control" placeholder="Send amount" value={transferState.amount} type="number" onChange={setTransfer(t.tokenAddress, 'amount')} /> </div>
                <div className="col-2">
                <input className="form-control" placeholder="Send to address" value={transferState.toAddress} onChange={setTransfer(t.tokenAddress, 'toAddress')} />
                </div>
                <div className="col-2">
                <button className="btn btn-primary" onClick={onSendTransaction}>Send</button>
                </div>
              </div>
            </p>
          ))}
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-12">
          <div className="form-group">
            <label>
              Customer id:{" "}
              <input
                type="text"
                className="form-control"
                value={input.id}
                onChange={onInputChange("id")}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Customer address:{" "}
              <input
                type="text"
                className="form-control"
                value={input.address}
                onChange={onInputChange("address")}
              />
            </label>
          </div>
          <div className="form-group">
            <button onClick={addCustodian} className="btn btn-primary">
              Create
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">Custodians:</div>

        <table style={{ width: "100%" }} border="1">
          <thead>
            <tr>
              <th>id</th>
              <th>customer address</th>
              <th>contract address</th>
              <th>balance</th>
              <th>import token</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {custodians.map((c, key) => {
              return (
                <tr key={key}>
                  <td>{c.id}</td>
                  <td>{c.address}</td>
                  <td>{c.contractAddress}</td>
                  <td>{c.balances && c.balances.map((b,key) => <span key={key}>{b.balance}{b.token},</span>)}</td>
                  <td>
                    <select value={input.token} onChange={e => setInput({...input,token:e.target.value})}>
                      <option vlaue=""></option>
                      {tokens.map(t => <option value={t.tokenAddress}>{t.token}</option>)}
                    </select>
                    <button onClick={onSelectToken(c)} className="btn btn-info">Import</button>
                  </td>
                  <td>
                    <button className="btn btn-info" onClick={onWithdraw(c)}>Withdraw</button>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={deleteCustodian(c)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={6}>
                <button className="btn btn-danger" onClick={resetTable}>
                  Reset
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustodianDApp;
