import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { getSolanaChainConfig } from "@web3auth/base";
import RPC from "../../solanaRPC";
import "./Header.css";

// Constants
const clientId =
  "BO64YmrgP9IlUvt2__kcdilBAdRuC7Q7-uGOajbW5UNpN69GLTFJmCFF1E0X-V2NLs5OM7VapVZuWCF-KTNT5kg";
//Free one: BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ

export default function Header() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [fullWalletAddress, setFullWalletAddress] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = getSolanaChainConfig(0x3)!; // 0x3 Solana Devnet
        const solanaPrivateKeyProvider = new SolanaPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3auth = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider: solanaPrivateKeyProvider,
        });

        setWeb3auth(web3auth);
        await web3auth.initModal();

        if (web3auth.connected) {
          setIsConnected(true);
          await getAccountAddress(web3auth.provider);
          await getUserInfo(web3auth);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAccountAddress = async (provider: any) => {
    if (!provider) return;
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    setFullWalletAddress(address[0]);
    const shortenedAddress = formatAddress(address[0]);
    setWalletAddress(shortenedAddress);
    return address[0];
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 4)}...${address.substring(
      address.length - 4
    )}`;
  };

  const getUserInfo = async (web3auth: Web3Auth) => {
    if (!web3auth) {
      console.error("web3auth not initialized yet");
      return;
    }
    try {
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      return user;
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  };

  const connectWallet = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized");
      return;
    }

    const provider = await web3auth.connect();
    if (web3auth.connected) {
      setIsConnected(true);
      const fullAddress = await getAccountAddress(provider);
      const user = await getUserInfo(web3auth);

      console.log("User Name:", user?.name);
      console.log("User Email:", user?.email);
      console.log("User Wallet Address:", fullAddress);
    }
  };

  const disconnectWallet = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized");
      return;
    }

    await web3auth.logout();
    setIsConnected(false);
    setWalletAddress("");
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const goToWalletSettings = () => {
    navigate("/wallet");
    setIsDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          Solana DApp
        </Link>
      </div>
      <div className="header-right">
        {!isConnected ? (
          <button onClick={connectWallet} className="wallet-button">
            Wallet Connect
          </button>
        ) : (
          <div className="wallet-dropdown-container" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="wallet-address-button">
              {userInfo?.name || walletAddress}
              <span
                className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
              >
                ▼
              </span>
            </button>
            {isDropdownOpen && (
              <div className="wallet-dropdown">
                <div className="user-info">
                  {userInfo && (
                    <div className="user-info-content">
                      <div className="user-details">
                        <h4 className="user-name">
                          {userInfo.name || "Anonymous"}
                        </h4>
                        <p className="user-email">{userInfo.email}</p>
                        <div className="wallet-address">
                          <span className="address-label">Wallet:</span>
                          <span className="address-value">{walletAddress}</span>
                          <button
                            className="copy-button"
                            onClick={() => {
                              navigator.clipboard.writeText(fullWalletAddress);
                            }}
                            title="Copy wallet address"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="dropdown-actions">
                  <button
                    onClick={goToWalletSettings}
                    className="dropdown-item"
                  >
                    Wallet Settings
                  </button>
                  <button onClick={disconnectWallet} className="dropdown-item">
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
