import React, { useState } from "react";
import styles from "@/app/styles/Web3Features.module.css";
import { COREKIT_STATUS } from "@web3auth/mpc-core-kit";

interface Web3FeaturesProps {
  coreKitStatus: COREKIT_STATUS;
  onGetUserInfo: () => void;
  onKeyDetails: () => void;
  onEnableMFA: () => void;
  onGetAccounts: () => void;
  onGetBalance: () => void;
  onSignMessage: () => void;
  onSendTransaction: () => void;
  onSendTokens: (recipientAddress: string, amount: string) => void;
  onCreateMnemonicFactor: () => void;
  onDeleteFactor: () => void;
}

const Web3Features: React.FC<Web3FeaturesProps> = ({
  coreKitStatus,
  onGetUserInfo,
  onKeyDetails,
  onEnableMFA,
  onGetAccounts,
  onGetBalance,
  onSignMessage,
  onSendTransaction,
  onSendTokens,
  onCreateMnemonicFactor,
  onDeleteFactor,
}) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  if (coreKitStatus !== COREKIT_STATUS.LOGGED_IN) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2>Account Management</h2>
        <div className={styles.buttonGrid}>
          <button onClick={onGetUserInfo} className={styles.button}>
            Get User Info
          </button>
          <button onClick={onKeyDetails} className={styles.button}>
            Key Details
          </button>
          <button onClick={onEnableMFA} className={styles.button}>
            Enable MFA
          </button>
          <button onClick={onCreateMnemonicFactor} className={styles.button}>
            Generate Backup (Mnemonic)
          </button>
          <button onClick={onDeleteFactor} className={styles.button}>
            Delete Social Factor
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Wallet Operations</h2>
        <div className={styles.buttonGrid}>
          <button onClick={onGetAccounts} className={styles.button}>
            Get Accounts
          </button>
          <button onClick={onGetBalance} className={styles.button}>
            Get Balance
          </button>
          <button onClick={onSignMessage} className={styles.button}>
            Sign Message
          </button>
          <button onClick={onSendTransaction} className={styles.button}>
            Send Transaction
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Send Tokens</h2>
        <div className={styles.sendForm}>
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Amount (in ETH)"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            className={styles.input}
          />
          <button
            onClick={() => onSendTokens(recipientAddress, sendAmount)}
            className={styles.button}
          >
            Send Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default Web3Features;
