import React from "react";
import "./Homepage.css";

export default function Homepage() {
  return (
    <>
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Seamless payments powered by SolBeacon</h1>
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
    </>
  );
}
