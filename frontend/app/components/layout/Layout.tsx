import React from "react";
import Header from "./Header";
import { COREKIT_STATUS } from "@web3auth/mpc-core-kit";
import styles from "@/app/styles/Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
  coreKitStatus: COREKIT_STATUS;
  onLogin: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  coreKitStatus,
  onLogin,
  onLogout,
}) => {
  return (
    <div className={styles.layout}>
      <Header
        coreKitStatus={coreKitStatus}
        onLogin={onLogin}
        onLogout={onLogout}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;
