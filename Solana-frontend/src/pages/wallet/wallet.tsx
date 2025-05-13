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
import CreatePassword from "./createPassword";

// Feel free to use this clientId => this one is public anyway
const clientId = process.env.REACT_APP_WEB3AUTH_CLIENT_ID;

// from dashboard: BO64YmrgP9IlUvt2__kcdilBAdRuC7Q7-uGOajbW5UNpN69GLTFJmCFF1E0X-V2NLs5OM7VapVZuWCF-KTNT5kg

// Function to format console output with clickable links
const formatConsoleOutput = (output: string) => {
  if (!output) return "";

  // Regular expression to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Replace URLs with HTML link tags
  const formattedOutput = output.replace(
    urlRegex,
    '<a href="$&" target="_blank" rel="noopener noreferrer" class="console-link">$&</a>'
  );

  return formattedOutput;
};

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
  const [disposableBalance, setDisposableBalance] = useState<string>("0");
  const [chainInfo, setChainInfo] = useState<any>(null);

  // API data state
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Transaction loading state
  const [transactionLoading, setTransactionLoading] = useState<boolean>(false);
  const [transactionProgress, setTransactionProgress] = useState<number>(0);
  const [transactionStatus, setTransactionStatus] = useState<string>("");

  // Get custom chain configs for your chain
  const chainConfig = getSolanaChainConfig(0x3)!; // 0x3 Solana Devnet

  // Convert lamports to SOL
  const lamportsToSol = (lamports: string): string => {
    const value = parseFloat(lamports) / 1000000000;
    return value.toFixed(4);
  };

  const [topupAmount, setTopupAmount] = useState<string>("0.1");
  const [topupError, setTopupError] = useState<string>("");

  // Add state to track private key visibility
  const [showingPrivateKey, setShowingPrivateKey] = useState<boolean>(false);

  // Fetch user's disposable balance from API
  const fetchDisposableBalance = async () => {
    if (!walletAddress) return;

    try {
      const userData = await apiService.getUserByWalletAddress(walletAddress);
      if (userData && userData.balanceTransferred !== undefined) {
        // Round to 4 decimal places
        const formattedBalance = userData.balanceTransferred.toFixed(4);
        setDisposableBalance(formattedBalance);
      }
    } catch (error) {
      console.error("Error fetching disposable balance:", error);
      // Don't show error to user, just log it
    }
  };

  useEffect(() => {
    // Fetch disposable balance whenever wallet address changes
    if (walletAddress) {
      fetchDisposableBalance();
    }
  }, [walletAddress]);

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

          // Get user info and create/update user in backend
          const user = await web3auth.getUserInfo();
          if (user?.name && user?.email && address[0]) {
            try {
              const response = await apiService.createUser({
                name: user.name,
                email: user.email,
                walletAddress: address[0],
              });
              // JWT token will be automatically stored by the API service
              console.log("User authenticated:", response);
            } catch (error) {
              console.error("Error creating/updating user:", error);
            }
          }

          // Fetch disposable balance
          await fetchDisposableBalance();
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
    // Clear JWT token on logout
    apiService.clearToken();
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user.email, user.name);
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

    if (showingPrivateKey) {
      // If already showing private key, clear console and update button state
      setConsoleOutput("Private key hidden");
      setShowingPrivateKey(false);
    } else {
      // Get and display private key
      const rpc = new RPC(provider);
      const privateKey = await rpc.getPrivateKey();
      uiConsole(privateKey);
      setShowingPrivateKey(true);
    }
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

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show success feedback
        const copyButtons = document.querySelectorAll(".copy-button");
        copyButtons.forEach((button) => {
          if (button.getAttribute("data-signature") === text) {
            // Add a temporary success class
            button.classList.add("copy-success");

            // Reset after a short delay
            setTimeout(() => {
              button.classList.remove("copy-success");
            }, 1000);
          }
        });
      })
      .catch((err) => {
        console.error("Failed to copy signature: ", err);
      });
  };

  // Function to create a shortened version of the signature with a copy button
  const getFormattedSignature = (signature: string) => {
    const shortSignature = `${signature.slice(0, 4)}...${signature.slice(-4)}`;
    const solscanUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;

    return `<a href="${solscanUrl}" target="_blank" rel="noopener noreferrer" class="console-link">${shortSignature}</a> <span class="copy-button" data-signature="${signature}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" /></svg></span>`;
  };

  // Add event listener for copy buttons when the component mounts
  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("copy-button")) {
        const signature = target.getAttribute("data-signature");
        if (signature) {
          copyToClipboard(signature);
        }
      }
    };

    document.addEventListener("click", handleCopyClick);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleCopyClick);
    };
  }, []);

  // Function to send SOL to a specific address
  const sendSolToAddress = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }

    try {
      // Validate topup amount against wallet balance
      const topupAmountNum = parseFloat(topupAmount);
      const solBalanceNum = parseFloat(solBalance);

      if (topupAmountNum <= 0) {
        setTopupError("Amount must be greater than 0");
        return;
      }

      if (topupAmountNum > solBalanceNum) {
        setTopupError(
          "Insufficient balance. You cannot send more than your wallet holds."
        );
        return;
      }

      // Clear any previous errors
      setTopupError("");

      // Start loading and reset progress
      setTransactionLoading(true);
      setTransactionProgress(10);
      setTransactionStatus("Checking system health...");

      // Check health endpoint first
      try {
        await apiService.checkHealth();
      } catch (error) {
        setTransactionLoading(false);
        uiConsole(
          `❌ System Health Check Failed\n\n` +
            `The system is currently unavailable. Please try again later.\n` +
            `Error: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }

      setApiLoading(true);
      uiConsole("Sending transaction... Please wait for confirmation.");

      // Simulate progress while waiting for blockchain
      let progressInterval = setInterval(() => {
        setTransactionProgress((prev) => {
          if (prev < 70) return prev + 5;
          return prev;
        });
      }, 1000);

      setTransactionProgress(20);
      setTransactionStatus("Sending transaction to Solana network...");

      const rpc = new RPC(provider);
      const receipt = await rpc.sendSolToAddress(
        "PAYvoS6ezYo5kS66dMDpZfwVdshfgpRzs6vDzfZ1tEe",
        topupAmount
      );

      setTransactionProgress(70);
      setTransactionStatus("Transaction sent! Waiting for confirmation...");

      if (receipt.startsWith("Transaction failed:")) {
        clearInterval(progressInterval);
        setTransactionProgress(100);
        setTransactionStatus("Transaction failed");
        setTimeout(() => setTransactionLoading(false), 1500);
        uiConsole(receipt);
      } else {
        // Refresh balance after successful transaction
        setTransactionProgress(80);
        setTransactionStatus("Transaction confirmed! Updating balances...");

        const newBalance = await rpc.getBalance();
        setWalletBalance(newBalance);
        setSolBalance(lamportsToSol(newBalance));

        // Submit transaction data to the backend
        try {
          setTransactionProgress(90);
          setTransactionStatus("Syncing with database...");

          const transactionData = {
            walletAddress: walletAddress,
            transactionHash: receipt,
          };

          const apiResponse = await apiService.submitTransaction(
            transactionData
          );
          // Only log API response to console, not to UI
          console.log("API Response:", apiResponse);

          // Refresh disposable balance
          await fetchDisposableBalance();

          setTransactionProgress(100);
          setTransactionStatus("Transaction complete!");

          // Short delay to show success before closing modal
          setTimeout(() => setTransactionLoading(false), 1500);

          // Show simplified success message with transaction details
          uiConsole(
            `✅ Payment Successfully Completed!\n\n` +
              `Amount: ${topupAmount} SOL\n` +
              `Signature: ${getFormattedSignature(receipt)}\n` +
              `Balance: ${parseFloat(lamportsToSol(newBalance)).toFixed(
                4
              )} SOL\n` +
              `Credits: ${disposableBalance} SOL`
          );
        } catch (apiError) {
          clearInterval(progressInterval);
          setTransactionProgress(95);
          setTransactionStatus("Transaction successful, but API update failed");

          // Short delay to show status before closing modal
          setTimeout(() => setTransactionLoading(false), 1500);

          // Log the error to the browser console
          console.error("API Error:", apiError);

          // Show simplified error message to the user
          uiConsole(
            `⚠️ Payment Partially Completed\n\n` +
              `Transaction was confirmed on the blockchain, but we couldn't update your account.\n` +
              `Amount: ${topupAmount} SOL\n` +
              `Signature: ${getFormattedSignature(receipt)}\n` +
              `Balance: ${parseFloat(lamportsToSol(newBalance)).toFixed(
                4
              )} SOL\n\n` +
              `Your credits may take a moment to update.`
          );
        }
      }

      clearInterval(progressInterval);
    } catch (error) {
      setTransactionProgress(100);
      setTransactionStatus("Error occurred during transaction");
      setTimeout(() => setTransactionLoading(false), 1500);
      uiConsole(
        `❌ Payment Failed\n\n` +
          `There was an error processing your transaction.\n` +
          `Error: ${
            error instanceof Error ? error.message : String(error)
          }\n\n` +
          `Please try again later.`
      );
    } finally {
      setApiLoading(false);
    }
  };

  // Update topup amount handler to validate in real-time
  const handleTopupAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setTopupAmount(newAmount);

    // Real-time validation
    const newAmountNum = parseFloat(newAmount);
    const solBalanceNum = parseFloat(solBalance);

    if (newAmountNum <= 0) {
      setTopupError("Amount must be greater than 0");
    } else if (newAmountNum > solBalanceNum) {
      setTopupError(
        `Insufficient balance (max: ${solBalanceNum.toFixed(4)} SOL)`
      );
    } else {
      setTopupError(""); // Clear error when input is valid
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
            <span className="balance-value">
              {parseFloat(solBalance).toFixed(4)} SOL
            </span>
          </div>
          <div className="balance-display">
            <span className="balance-label">Available Credits:</span>
            <span className="balance-value disposable-balance">
              {disposableBalance} SOL
            </span>
            <CreatePassword
              walletAddress={walletAddress}
              apiLoading={apiLoading}
              setApiLoading={setApiLoading}
            />
          </div>
        </div>
      </div>

      {/* Action Groups */}
      <div className="action-container">
        <h2>Wallet Actions</h2>

        <section className="topup-section">
          <h3 className="topup-title">
            Topup Balance
            <span className="current-balance-indicator">
              Available: {parseFloat(solBalance).toFixed(4)} SOL
            </span>
          </h3>
          <div className="topup-container">
            <div className="topup-input-wrapper">
              <input
                type="number"
                value={topupAmount}
                onChange={handleTopupAmountChange}
                min="0.000001"
                step="0.01"
                className={`topup-input ${
                  topupError ? "topup-input-error" : ""
                }`}
                placeholder="0.0"
                disabled={apiLoading}
              />
              <span className="sol-badge">SOL</span>
            </div>
            {topupError && (
              <div className="topup-error">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{topupError}</span>
              </div>
            )}
            <button
              onClick={sendSolToAddress}
              className="topup-button"
              disabled={apiLoading || !!topupError}
            >
              {apiLoading ? "Processing..." : "Topup Balance"}
            </button>
          </div>
          <div className="recipient-address">
            <svg
              className="recipient-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            ></svg>
            <span>PAYvoS6ezYo5kS66dMDpZfwVdshfgpRzs6vDzfZ1tEe</span>
          </div>
          <div className="api-note">
            <small>
              Note: Transaction details will be recorded in our system.
            </small>
          </div>
        </section>
      </div>

      <button onClick={getPrivateKey} className="get-key-button">
        {showingPrivateKey ? "Hide Private Key" : "Get Private Key"}
      </button>
    </div>
  );

  const unloggedInView = (
    <div className="login-section">
      <p>Connect your wallet to access your dashboard</p>
      {/* <button onClick={login} className="wallet-action-button login-button">
        Connect Wallet
      </button> */}
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

      {/* Transaction Loading Modal */}
      {transactionLoading && (
        <div className="transaction-modal-overlay">
          <div className="transaction-modal">
            <div className="transaction-modal-header">
              <h3>Processing Transaction</h3>
              <p>Please do not close this window</p>
            </div>

            <div className="transaction-progress-container">
              <div
                className="transaction-progress-bar"
                style={{ width: `${transactionProgress}%` }}
              >
                <div className="transaction-progress-glow"></div>
              </div>
            </div>

            <div className="transaction-status">
              <p>{transactionStatus}</p>
              <div className="transaction-progress-percent">
                {transactionProgress}%
              </div>
            </div>

            <div className="transaction-modal-footer">
              <div className="transaction-animation">
                <div className="transaction-pulse"></div>
                <svg viewBox="0 0 24 24" className="transaction-icon">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p className="transaction-warning">
                Please wait until the transaction is complete
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="console-output">
        <h3>Console Output</h3>

        <pre dangerouslySetInnerHTML={{ __html: consoleOutput }}></pre>
      </div>
    </div>
  );
}
