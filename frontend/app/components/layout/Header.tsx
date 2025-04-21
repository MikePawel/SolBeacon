import React from "react";
import { COREKIT_STATUS } from "@web3auth/mpc-core-kit";
import styles from "@/app/styles/Header.module.css";

interface HeaderProps {
  coreKitStatus: COREKIT_STATUS;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  coreKitStatus,
  onLogin,
  onLogout,
}) => {
  const isLoggedIn = coreKitStatus === COREKIT_STATUS.LOGGED_IN;

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>Mikes MPC Porject</h1>
      </div>
      <nav className={styles.nav}>
        <div className={styles.navLinks}>
          <a href="#" className={styles.navLink}>
            Home
          </a>
          <a href="#" className={styles.navLink}>
            Features
          </a>
          <a href="#" className={styles.navLink}>
            Docs
          </a>
        </div>
        <button
          onClick={isLoggedIn ? onLogout : onLogin}
          className={`${styles.connectButton} ${isLoggedIn ? styles.connected : ""}`}
        >
          {isLoggedIn ? "Disconnect Wallet" : "Connect Wallet"}
        </button>
      </nav>
    </header>
  );
};

export default Header;
