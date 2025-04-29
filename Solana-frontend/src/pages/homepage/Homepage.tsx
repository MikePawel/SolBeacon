import React, { useState, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import { getSolanaChainConfig } from "@web3auth/base";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import RPC from "../../solanaRPC";
import "./Homepage.css";

// Constants
const clientId =
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

export default function Homepage() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const connectWallet = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized");
      return;
    }

    const provider = await web3auth.connect();
    if (web3auth.connected) {
      setIsConnected(true);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Blockchain & iBeacon Integration</h1>
        <p className="hero-tagline">
          Revolutionizing proximity-based transactions through seamless
          blockchain integration
        </p>
      </div>

      {/* Intro Section */}
      <div className="intro-section">
        <h2>The Framework</h2>
        <p>
          A comprehensive solution that combines blockchain technology with
          Bluetooth Low Energy (BLE) and iBeacon standards to create secure,
          user-friendly proximity-triggered financial transactions.
        </p>
      </div>

      {/* Features */}
      <div className="features-grid">
        <div className="feature-card">
          <h3>MPC Wallet</h3>
          <p>
            Distributed key management with threshold signatures for enhanced
            security while maintaining simplicity
          </p>
        </div>
        <div className="feature-card">
          <h3>Smart Contracts</h3>
          <p>
            Conditional payment logic for secure transactions based on specific
            proximity events
          </p>
        </div>
        <div className="feature-card">
          <h3>iBeacon Integration</h3>
          <p>
            Precise location-based service delivery through advanced proximity
            technology
          </p>
        </div>
      </div>

      {/* CTA Section */}
      {!isConnected && (
        <div className="cta-container">
          <h2>Experience the Future of Proximity Payments</h2>
          <button onClick={connectWallet} className="cta-button">
            Connect Wallet
          </button>
        </div>
      )}
    </>
  );
}
