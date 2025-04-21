import React, { useState } from "react";
import styles from "@/app/styles/ControlPanel.module.css";
import {
  Web3AuthMPCCoreKit,
  FactorKeyTypeShareDescription,
  TssShareType,
  COREKIT_STATUS,
  generateFactorKey,
  keyToMnemonic,
  mnemonicToKey,
  parseToken,
} from "@web3auth/mpc-core-kit";
import { BN } from "bn.js";
import { Point, secp256k1 } from "@tkey/common-types";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";

interface ControlPanelProps {
  coreKitInstance: Web3AuthMPCCoreKit;
}

const firebaseConfig = {
  apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
  authDomain: "web3auth-oauth-logins.firebaseapp.com",
  projectId: "web3auth-oauth-logins",
  storageBucket: "web3auth-oauth-logins.appspot.com",
  messagingSenderId: "461819774167",
  appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
};

const ControlPanel: React.FC<ControlPanelProps> = ({ coreKitInstance }) => {
  const [backupFactorKey, setBackupFactorKey] = useState<string>("");
  const [mnemonicFactor, setMnemonicFactor] = useState<string>("");
  const app = initializeApp(firebaseConfig);

  const getUserInfo = async () => {
    const user = coreKitInstance.getUserInfo();
    console.log("User Info:", user);
  };

  const keyDetails = async () => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance not found");
    }
    const details = coreKitInstance.getKeyDetails();
    console.log("Key Details:", details);
  };

  const enableMFA = async () => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    try {
      const factorKey = new BN(await getSocialMFAFactorKey(), "hex");
      console.log("Using the Social Factor Key to Enable MFA, please wait...");
      await coreKitInstance.enableMFA({
        factorKey,
        shareDescription: FactorKeyTypeShareDescription.SocialShare,
      });

      if (coreKitInstance.status === COREKIT_STATUS.LOGGED_IN) {
        await coreKitInstance.commitChanges();
      }

      console.log(
        "MFA enabled, device factor stored in local store, deleted hashed cloud key, your backup factor key is associated with the firebase email password account in the app"
      );
    } catch (e) {
      console.error(e);
    }
  };

  const getSocialMFAFactorKey = async (): Promise<string> => {
    try {
      const auth = getAuth(app);
      const res = await signInWithEmailAndPassword(
        auth,
        "custom+jwt@firebase.login",
        "Testing@123"
      );
      console.log(res);
      const idToken = await res.user.getIdToken(true);
      const userInfo = parseToken(idToken);

      const factorKey = await coreKitInstance.state.postBoxKey;
      console.log("Social Factor Key:", factorKey);
      setBackupFactorKey(factorKey as string);
      return factorKey as string;
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const deleteFactor = async () => {
    let factorPub: string | undefined;
    for (const [key, value] of Object.entries(
      coreKitInstance.getKeyDetails().shareDescriptions
    )) {
      if (value.length > 0) {
        const parsedData = JSON.parse(value[0]);
        if (parsedData.module === FactorKeyTypeShareDescription.SocialShare) {
          factorPub = key;
        }
      }
    }
    if (factorPub) {
      console.log(
        "Deleting Social Factor, please wait...",
        "Factor Pub:",
        factorPub
      );
      const pub = Point.fromSEC1(secp256k1, factorPub);
      await coreKitInstance.deleteFactor(pub);
      await coreKitInstance.commitChanges();
      console.log("Social Factor deleted");
    } else {
      console.log("No social factor found to delete");
    }
  };

  const createMnemonicFactor = async (): Promise<void> => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    console.log("export share type:", TssShareType.RECOVERY);
    const factorKey = generateFactorKey();
    await coreKitInstance.createFactor({
      shareType: TssShareType.RECOVERY,
      factorKey: factorKey.private,
      shareDescription: FactorKeyTypeShareDescription.SeedPhrase,
    });
    const factorKeyMnemonic = await keyToMnemonic(
      factorKey.private.toString("hex")
    );
    if (coreKitInstance.status === COREKIT_STATUS.LOGGED_IN) {
      await coreKitInstance.commitChanges();
    }
    console.log("Export factor key mnemonic:", factorKeyMnemonic);
  };

  const getDeviceFactor = async () => {
    try {
      const factorKey = await coreKitInstance.getDeviceFactor();
      setBackupFactorKey(factorKey as string);
      console.log("Device share:", factorKey);
    } catch (e) {
      console.error(e);
    }
  };

  const inputBackupFactorKey = async () => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance not found");
    }
    if (!backupFactorKey) {
      throw new Error("backupFactorKey not found");
    }
    const factorKey = new BN(backupFactorKey, "hex");
    await coreKitInstance.inputFactorKey(factorKey);
    console.log("Backup factor key input successful");
  };

  const MnemonicToFactorKeyHex = async (mnemonic: string) => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    try {
      const factorKey = await mnemonicToKey(mnemonic);
      setBackupFactorKey(factorKey);
      console.log("Mnemonic converted to factor key:", factorKey);
      return factorKey;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.controlPanel}>
      <div className={styles.controlCard}>
        <h2>Control Panel</h2>
        <div className={styles.buttonGrid}>
          <button onClick={getUserInfo} className={styles.button}>
            Get User Info
          </button>
          <button onClick={keyDetails} className={styles.button}>
            Key Details
          </button>
          <button onClick={enableMFA} className={styles.button}>
            Enable MFA
          </button>
          <button onClick={getDeviceFactor} className={styles.button}>
            Get Device Factor
          </button>
          <button onClick={createMnemonicFactor} className={styles.button}>
            Generate Backup (Mnemonic)
          </button>
          <button onClick={deleteFactor} className={styles.button}>
            Delete Social Factor
          </button>
        </div>

        <div className={styles.mnemonicSection}>
          <h3>Recovery Options</h3>
          <div className={styles.inputGroup}>
            <label>Recover Using Mnemonic Factor Key:</label>
            <input
              value={mnemonicFactor}
              onChange={(e) => setMnemonicFactor(e.target.value)}
              placeholder="Enter your mnemonic phrase"
              className={styles.input}
            />
            <button
              onClick={() => MnemonicToFactorKeyHex(mnemonicFactor)}
              className={styles.button}
            >
              Get Recovery Factor Key using Mnemonic
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Backup/Device Factor: {backupFactorKey}</label>
            <button onClick={inputBackupFactorKey} className={styles.button}>
              Input Backup Factor Key
            </button>
          </div>

          <button onClick={getSocialMFAFactorKey} className={styles.button}>
            Get Social MFA Factor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
