import React, { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import {
  CHAIN_NAMESPACES,
  IAdapter,
  IProvider,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
  getSolanaChainConfig,
} from "@web3auth/base";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { getDefaultExternalAdapters } from "@web3auth/default-solana-adapter";
import RPC from "../../solanaRPC";
import apiService from "../../services/api";
import "./wallet.css";

// Constants
const clientId =
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";
//Free one: BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ
// from dashboard: BO64YmrgP9IlUvt2__kcdilBAdRuC7Q7-uGOajbW5UNpN69GLTFJmCFF1E0X-V2NLs5OM7VapVZuWCF-KTNT5kg

export default function Wallet() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    "Loading wallet information..."
  );

  // Information display states
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<string>("");
  const [solBalance, setSolBalance] = useState<string>("0");
  const [chainInfo, setChainInfo] = useState<any>(null);

  // API data state
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Get custom chain configs for your chain
  const chainConfig = getSolanaChainConfig(0x3)!; // 0x3 Solana Devnet

  // Convert lamports to SOL
  const lamportsToSol = (lamports: string): string => {
    const value = parseFloat(lamports) / 1000000000;
    return value.toFixed(4);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const solanaPrivateKeyProvider = new SolanaPrivateKeyProvider({
          config: { chainConfig: chainConfig },
        });

        const web3auth = new Web3Auth({
          clientId,
          uiConfig: {
            appName: "Solana App",
            mode: "light",
            logoLight: "https://web3auth.io/images/web3authlog.png",
            logoDark: "https://web3auth.io/images/web3authlogodark.png",
            defaultLanguage: "en",
            loginGridCol: 3,
            primaryButton: "externalLogin",
            uxMode: "redirect",
          },
          // web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          privateKeyProvider: solanaPrivateKeyProvider,
        });

        // Setup external adapters
        const adapters = getDefaultExternalAdapters({
          options: {
            clientId,
            chainConfig,
          },
        });
        adapters.forEach((adapter: IAdapter<any>) => {
          web3auth.configureAdapter(adapter);
        });

        setWeb3auth(web3auth);

        // Initialize but don't show the modal
        await web3auth.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.AUTH]: {
              label: "auth",
              loginMethods: {
                facebook: {
                  name: "facebook",
                  showOnModal: false,
                },
                reddit: {
                  name: "reddit",
                  showOnModal: false,
                },
                twitch: {
                  name: "twitch",
                  showOnModal: false,
                },
                line: {
                  name: "line",
                  showOnModal: false,
                },
                kakao: {
                  name: "kakao",
                  showOnModal: false,
                },
                linkedin: {
                  name: "linkedin",
                  showOnModal: false,
                },
                twitter: {
                  name: "twitter",
                  showOnModal: false,
                },
                weibo: {
                  name: "weibo",
                  showOnModal: false,
                },
                wechat: {
                  name: "wechat",
                  showOnModal: false,
                },
                farcaster: {
                  name: "farcaster",
                  showOnModal: false,
                },
                email_passwordless: {
                  name: "email-passwordless",
                  showOnModal: true,
                },
                sms_passwordless: {
                  name: "sms-passwordless",
                  showOnModal: true,
                },
              },
              showOnModal: true,
            },
          },
        });

        // Check if already connected
        if (web3auth.connected) {
          setLoggedIn(true);
          setProvider(web3auth.provider);

          // Fetch initial data
          if (web3auth.provider) {
            const rpc = new RPC(web3auth.provider);
            const address = await rpc.getAccounts();
            setWalletAddress(address[0]);

            try {
              const balance = await rpc.getBalance();
              setWalletBalance(balance);
              setSolBalance(lamportsToSol(balance));
            } catch (error) {
              console.error("Error fetching balance:", error);
            }
          }

          const chainData = {
            chainId: chainConfig.chainId,
            displayName: chainConfig.displayName,
            ticker: chainConfig.ticker,
            tickerName: chainConfig.tickerName,
          };
          setChainInfo(chainData);

          setConsoleOutput(
            "Wallet connected successfully. Select an action below."
          );
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connect();

    if (web3auth.connected) {
      setLoggedIn(true);
      setProvider(web3authProvider);

      // Fetch initial data after login
      if (web3authProvider) {
        const rpc = new RPC(web3authProvider);
        const address = await rpc.getAccounts();
        setWalletAddress(address[0]);

        try {
          const balance = await rpc.getBalance();
          setWalletBalance(balance);
          setSolBalance(lamportsToSol(balance));
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }

      const chainData = {
        chainId: chainConfig.chainId,
        displayName: chainConfig.displayName,
        ticker: chainConfig.ticker,
        tickerName: chainConfig.tickerName,
      };
      setChainInfo(chainData);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    setWalletAddress("");
    setWalletBalance("");
    setSolBalance("0");
    setChainInfo(null);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
    uiConsole(idToken);
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    setWalletAddress(address[0]);
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    setWalletBalance(balance);
    setSolBalance(lamportsToSol(balance));
    uiConsole(`Balance: ${lamportsToSol(balance)} SOL`);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
  };

  const sendVersionTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendVersionTransaction();
    uiConsole(receipt);
  };

  const signVersionedTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.signVersionedTransaction();
    uiConsole(receipt);
  };

  const signAllVersionedTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.signAllVersionedTransaction();
    uiConsole(receipt);
  };

  const signAllTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.signAllTransaction();
    uiConsole(receipt);
  };

  const getPrivateKey = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    uiConsole(privateKey);
  };

  const getChainInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const chainConfig = web3auth.coreOptions.chainConfig;
    if (!chainConfig) {
      uiConsole("Chain config not available");
      return;
    }
    uiConsole({
      chainId: chainConfig.chainId,
      displayName: chainConfig.displayName,
      ticker: chainConfig.ticker,
      tickerName: chainConfig.tickerName,
    });
  };

  const addChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3auth?.addChain(chainConfig);
    uiConsole("New Chain Added");
  };

  const switchChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3auth?.switchChain({ chainId: "0x3" });
    uiConsole("Chain Switched");
  };

  // Function to fetch users from the API
  const fetchUsers = async () => {
    try {
      setApiLoading(true);
      setApiError(null);
      const users = await apiService.getUsers();
      setApiData(users);
      uiConsole("API Users fetched:", users);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setApiError(`Failed to fetch users: ${errorMessage}`);
      uiConsole("API Error:", errorMessage);
    } finally {
      setApiLoading(false);
    }
  };

  function uiConsole(...args: any[]): void {
    const logMessage = args
      .map((arg) => {
        if (typeof arg === "object") {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      })
      .join(" ");

    setConsoleOutput(logMessage);
  }

  const loggedInView = (
    <div className="wallet-content">
      {/* Wallet Summary */}
      <div className="wallet-header">
        <div className="network-info">
          <span className="network-label">Network:</span>
          <span className="network-value">{chainInfo?.displayName}</span>
        </div>
        <div className="account-info">
          <div className="address-display">
            <span className="address-label">Address:</span>
            <span className="address-value">{walletAddress}</span>
          </div>
          <div className="balance-display">
            <span className="balance-label">Balance:</span>
            <span className="balance-value">{solBalance} SOL</span>
          </div>
        </div>
      </div>

      {/* Action Groups */}
      <div className="action-container">
        <h2>Wallet Actions</h2>

        <div className="action-row">
          <div className="action-group">
            <h3>Account</h3>
            <button onClick={getUserInfo} className="wallet-action-button">
              Get User Info
            </button>
            <button onClick={getAccounts} className="wallet-action-button">
              Refresh Address
            </button>
            <button onClick={getBalance} className="wallet-action-button">
              Refresh Balance
            </button>
            <button onClick={authenticateUser} className="wallet-action-button">
              Get ID Token
            </button>
          </div>

          <div className="action-group">
            <h3>Transactions</h3>
            <button onClick={sendTransaction} className="wallet-action-button">
              Send Transaction
            </button>
            <button
              onClick={sendVersionTransaction}
              className="wallet-action-button"
            >
              Send Version Transaction
            </button>
            <button onClick={signMessage} className="wallet-action-button">
              Sign Message
            </button>
            <button onClick={getPrivateKey} className="wallet-action-button">
              Get Private Key
            </button>
          </div>
        </div>

        <div className="action-row">
          <div className="action-group">
            <h3>Chain Management</h3>
            <button onClick={addChain} className="wallet-action-button">
              Add Chain
            </button>
            <button onClick={switchChain} className="wallet-action-button">
              Switch Chain
            </button>
            <button onClick={getChainInfo} className="wallet-action-button">
              Refresh Chain Info
            </button>
          </div>

          <div className="action-group">
            <h3>Advanced Signing</h3>
            <button
              onClick={signVersionedTransaction}
              className="wallet-action-button"
            >
              Sign Versioned Transaction
            </button>
            <button
              onClick={signAllVersionedTransaction}
              className="wallet-action-button"
            >
              Sign All Versioned Transactions
            </button>
            <button
              onClick={signAllTransaction}
              className="wallet-action-button"
            >
              Sign All Transactions
            </button>
          </div>
        </div>

        <div className="action-row session-row">
          <button
            onClick={logout}
            className="wallet-action-button logout-button"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>

      {/* API Integration Section */}
      <div className="api-section">
        <h2>API Integration</h2>
        <div className="action-card">
          <h3>Test API Connection</h3>
          <button onClick={fetchUsers} disabled={apiLoading}>
            {apiLoading ? "Loading..." : "Fetch Users"}
          </button>

          {apiError && <div className="api-error">{apiError}</div>}

          {apiData && (
            <div className="api-results">
              <h4>API Results:</h4>
              <pre>{JSON.stringify(apiData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const unloggedInView = (
    <div className="login-section">
      <p>Connect your wallet to access your dashboard</p>
      <button onClick={login} className="wallet-action-button login-button">
        Connect Wallet
      </button>
    </div>
  );

  return (
    <div className="wallet-page">
      <h1>Wallet Dashboard</h1>
      {loading ? (
        <div className="wallet-loading">
          <div className="loader"></div>
          <p>Loading wallet information...</p>
        </div>
      ) : loggedIn ? (
        <>{loggedInView}</>
      ) : (
        unloggedInView
      )}

      <div className="console-output">
        <h3>Console Output</h3>
        <pre>{consoleOutput}</pre>
      </div>
    </div>
  );
}
