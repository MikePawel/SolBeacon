import React, { useEffect, useState } from "react";
import styles from "@/app/styles/AccountInfo.module.css";
import { EthereumSigningProvider } from "@web3auth/ethereum-mpc-provider";
import RPC from "@/app/web3RPC";

interface AccountInfoProps {
  evmProvider: EthereumSigningProvider;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ evmProvider }) => {
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const address = await RPC.getAccounts(evmProvider);
        setAccountAddress(address);
        console.log("Account address:", address);

        const accountBalance = await RPC.getBalance(evmProvider);
        setBalance(accountBalance);
        console.log("Account balance:", accountBalance);
      } catch (error) {
        console.error("Error fetching account info:", error);
      }
    };

    if (evmProvider) {
      fetchAccountInfo();
    }
  }, [evmProvider]);

  return (
    <div className={styles.accountInfo}>
      <div className={styles.infoCard}>
        <div className={styles.infoItem}>
          <h3>Account Address</h3>
          <p>{accountAddress || "Not connected"}</p>
        </div>
        <div className={styles.infoItem}>
          <h3>Balance</h3>
          <p>{balance || "0"} TEST</p>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
