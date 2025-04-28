import React from "react";
import "./Homepage.css";

export default function Homepage() {
  return (
    <div className="homepage">
      <div className="hero-section">
        <h1>Welcome to Solana App</h1>
        <p>A decentralized application built on Solana blockchain</p>
        <p className="description">
          Connect your wallet to get started with blockchain interactions
        </p>
      </div>
    </div>
  );
}
