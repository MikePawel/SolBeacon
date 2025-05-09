// Suppress the punycode deprecation warning
process.removeAllListeners("warning");
// You can add this back for other warnings if needed
// process.on('warning', e => {
//   if (!e.message.includes('punycode')) console.warn(e.message);
// });

const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
require("dotenv").config();

// Don't initialize any connections or perform any operations on import
// Only connect when the function is actually called

/**
 * Sends 0.1 SOL to the specified wallet address on Solana Devnet
 * @param {string} recipientAddress - The recipient's wallet address
 * @returns {Promise<string>} - Transaction signature
 */
async function sendSol(
  recipientAddress = "GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi"
) {
  try {
    // Connect to Solana Devnet only when function is called
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Load payer's private key from environment variable
    const privateKeyEnv = process.env.PAYMASTER_PRIVATE_KEY;
    if (!privateKeyEnv) {
      throw new Error(
        "PAYMASTER_PRIVATE_KEY not found in environment variables"
      );
    }

    // Create a keypair from a JSON string
    const secretKeyString = privateKeyEnv;
    let secretKey;

    try {
      // Try parsing as JSON
      secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    } catch (e) {
      // If not valid JSON, check if it's a string of comma-separated numbers
      if (secretKeyString.includes(",")) {
        secretKey = Uint8Array.from(
          secretKeyString.split(",").map((num) => parseInt(num.trim()))
        );
      } else {
        // Otherwise, treat as a base64 encoded string
        secretKey = Uint8Array.from(Buffer.from(secretKeyString, "base64"));
      }
    }

    let payer;
    try {
      payer = Keypair.fromSecretKey(secretKey);
    } catch (e) {
      throw new Error(
        `Invalid private key format: ${e.message}. Please provide a valid Solana private key.`
      );
    }

    // Log public key for verification
    console.log(`Using payer public key: ${payer.publicKey.toString()}`);

    // Create recipient public key object
    const recipient = new PublicKey(recipientAddress);

    // Amount to send (0.1 SOL in lamports)
    const amount = 0.1 * LAMPORTS_PER_SOL;

    // Create a transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipient,
        lamports: amount,
      })
    );

    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      payer,
    ]);

    console.log(`Transaction completed. Signature: ${signature}`);
    console.log(`Sent 0.1 SOL to ${recipientAddress}`);

    return signature;
  } catch (error) {
    console.error("Error sending SOL:", error);
    throw error;
  }
}

// Only run if executed directly from command line, not when imported
if (require.main === module) {
  // Get recipient address from command line arguments if provided
  const recipientAddress =
    process.argv[2] || "GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi";

  console.log(`Sending 0.1 SOL to ${recipientAddress}...`);

  sendSol(recipientAddress)
    .then((signature) => {
      console.log("Transaction completed successfully!");
    })
    .catch((error) => {
      console.error("Transaction failed:", error.message);
      process.exit(1);
    });
}

module.exports = { sendSol };
