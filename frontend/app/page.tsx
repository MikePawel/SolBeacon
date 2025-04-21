"use client";
import { useEffect, useState } from "react";
import { tssLib } from "@toruslabs/tss-dkls-lib";
import { ADAPTER_EVENTS, CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumSigningProvider } from "@web3auth/ethereum-mpc-provider";
import { Point, secp256k1 } from "@tkey/common-types";
import Web3 from "web3";
import {
  COREKIT_STATUS,
  FactorKeyTypeShareDescription,
  generateFactorKey,
  JWTLoginParams,
  keyToMnemonic,
  makeEthereumSigner,
  mnemonicToKey,
  parseToken,
  TssShareType,
  WEB3AUTH_NETWORK,
  Web3AuthMPCCoreKit,
} from "@web3auth/mpc-core-kit";
import { BN } from "bn.js";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";

import Layout from "./components/layout/Layout";
import AccountInfo from "./components/web3/AccountInfo";
import ControlPanel from "./components/web3/ControlPanel";
import styles from "./styles/SendTokens.module.css";
import Toast from "./components/ui/Toast";

// Configuration
const web3AuthClientId = String(process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID);
const verifier = "w3a-firebase-demo";
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x5aff",
  rpcTarget: "https://testnet.sapphire.oasis.io",
  displayName: "Oasis Sapphire Testnet",
  blockExplorerUrl: "https://explorer.oasis.io/testnet/sapphire",
  ticker: "TEST",
  tickerName: "Oasis Network",
  logo: "https://cryptologos.cc/logos/oasis-network-rose-logo.png",
};

const firebaseConfig = {
  apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
  authDomain: "web3auth-oauth-logins.firebaseapp.com",
  projectId: "web3auth-oauth-logins",
  storageBucket: "web3auth-oauth-logins.appspot.com",
  messagingSenderId: "461819774167",
  appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
};

// Initialize instances
let coreKitInstance: Web3AuthMPCCoreKit;
let evmProvider: EthereumSigningProvider;

if (typeof window !== "undefined") {
  coreKitInstance = new Web3AuthMPCCoreKit({
    web3AuthClientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.DEVNET,
    storage: window.localStorage,
    manualSync: true,
    tssLib,
  });

  evmProvider = new EthereumSigningProvider({ config: { chainConfig } });
  evmProvider.setupProvider(makeEthereumSigner(coreKitInstance));
}

function App() {
  const [coreKitStatus, setCoreKitStatus] = useState<COREKIT_STATUS>(
    COREKIT_STATUS.NOT_INITIALIZED
  );
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; link?: string } | null>(
    null
  );

  // Firebase Initialization
  const app = initializeApp(firebaseConfig);

  useEffect(() => {
    const init = async () => {
      if (coreKitInstance.status === COREKIT_STATUS.NOT_INITIALIZED) {
        await coreKitInstance.init();
      }
      setCoreKitStatus(coreKitInstance.status);
    };
    init();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const login = async () => {
    try {
      if (!coreKitInstance) {
        throw new Error("initiated to login");
      }
      const loginRes = await signInWithGoogle();
      const idToken = await loginRes.user.getIdToken(true);
      const parsedToken = parseToken(idToken);

      const idTokenLoginParams = {
        verifier,
        verifierId: parsedToken.sub,
        idToken,
      } as JWTLoginParams;

      await coreKitInstance.loginWithJWT(idTokenLoginParams);
      if (coreKitInstance.status === COREKIT_STATUS.LOGGED_IN) {
        await coreKitInstance.commitChanges();
      }

      setCoreKitStatus(coreKitInstance.status);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = async () => {
    await coreKitInstance.logout();
    setCoreKitStatus(coreKitInstance.status);
  };

  const sendTokens = async () => {
    try {
      if (!recipientAddress || !sendAmount) {
        console.error("Please enter both recipient address and amount");
        return;
      }

      setIsLoading(true);
      console.log("Sending Transaction...");
      const web3 = new Web3(evmProvider as any);
      const fromAddress = (await web3.eth.getAccounts())[0];

      const weiAmount = web3.utils.toWei(sendAmount, "ether");
      const baseTransaction = {
        from: fromAddress,
        to: recipientAddress,
        value: weiAmount,
        chainId: 23295,
      };

      const estimatedGas = await web3.eth.estimateGas(baseTransaction);
      const gasLimit = (BigInt(estimatedGas) * BigInt(120)) / BigInt(100);
      const gasPrice = await web3.eth.getGasPrice();

      const transaction = {
        ...baseTransaction,
        gas: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        nonce: await web3.eth.getTransactionCount(fromAddress, "pending"),
      };

      const receipt = await web3.eth.sendTransaction(transaction);
      console.log("Transaction receipt:", receipt);

      setToast({
        message: `Transaction sent: ${receipt.transactionHash.slice(0, 8)}...${receipt.transactionHash.slice(-6)}`,
        link: `https://explorer.oasis.io/testnet/sapphire/tx/${receipt.transactionHash}`,
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setToast({
        message: "Transaction failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout coreKitStatus={coreKitStatus} onLogin={login} onLogout={logout}>
      {coreKitStatus === COREKIT_STATUS.LOGGED_IN && (
        <>
          <ControlPanel coreKitInstance={coreKitInstance} />
          <AccountInfo evmProvider={evmProvider} />
          <div className={styles.sendTokensContainer}>
            <div className={styles.sendTokensCard}>
              <h2>Send Tokens</h2>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Amount (in TEST)"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className={styles.input}
                />
                <button
                  onClick={sendTokens}
                  className={styles.sendButton}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Tokens"}
                </button>
              </div>
            </div>
          </div>
          {toast && (
            <Toast
              message={toast.message}
              link={toast.link}
              onClose={() => setToast(null)}
            />
          )}
        </>
      )}
    </Layout>
  );
}

export default App;
