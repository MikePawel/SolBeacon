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
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

export default function Header() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          privateKeyProvider: solanaPrivateKeyProvider,
        });

        setWeb3auth(web3auth);
        await web3auth.initModal();

        if (web3auth.connected) {
          setIsConnected(true);
          await getAccountAddress(web3auth.provider);
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
    const shortenedAddress = formatAddress(address[0]);
    setWalletAddress(shortenedAddress);
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 4)}...${address.substring(
      address.length - 4
    )}`;
  };

  const connectWallet = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized");
      return;
    }

    const provider = await web3auth.connect();
    if (web3auth.connected) {
      setIsConnected(true);
      await getAccountAddress(provider);
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
              {walletAddress}
              <span
                className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
              >
                ▼
              </span>
            </button>
            {isDropdownOpen && (
              <div className="wallet-dropdown">
                <button onClick={goToWalletSettings} className="dropdown-item">
                  Go to Wallet Settings
                </button>
                <button onClick={disconnectWallet} className="dropdown-item">
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
