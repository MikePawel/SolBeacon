import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/header/Header";
import Homepage from "./pages/homepage/Homepage";
import Wallet from "./pages/wallet/wallet";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
