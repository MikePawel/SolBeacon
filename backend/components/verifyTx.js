// Suppress the punycode deprecation warning
process.removeAllListeners("warning");

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");
require("dotenv").config();

/**
 * Verifies a transaction on Solana devnet and extracts the sender, amount, and recipient
 * @param {string} txHash - The transaction signature/hash to verify
 * @returns {Promise<Object>} - Transaction details including sender, amount, recipient and success status
 */
async function verifyTransaction(txHash) {
  try {
    // Connect to Solana Devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Get transaction details
    const txDetails = await connection.getTransaction(txHash, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txDetails) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Extract transfer instruction from transaction
    const transferInstruction = txDetails.transaction.message.instructions.find(
      (instruction) => {
        // System program transfer has program index 0
        const programId =
          txDetails.transaction.message.accountKeys[instruction.programIdIndex];
        return programId.equals(PublicKey.default); // Check if it's the System Program
      }
    );

    if (!transferInstruction) {
      return {
        success: false,
        message: "No transfer instruction found in transaction",
      };
    }

    // Get accounts involved in the transaction
    const accounts = txDetails.transaction.message.accountKeys;

    // In a standard SOL transfer, the first account is the sender and the second is the recipient
    const sender = accounts[0].toString();
    const recipient = accounts[1].toString();

    // Get the amount transferred
    // The amount is in lamports (smallest unit of SOL)
    const amount =
      txDetails.meta.postBalances[1] - txDetails.meta.preBalances[1];

    // Convert lamports to SOL for easier readability
    const amountInSol = amount / LAMPORTS_PER_SOL;

    // Check if transaction was successful
    const status = txDetails.meta.err ? "failed" : "success";

    return {
      success: true,
      sender,
      recipient,
      amount: amountInSol,
      amountInLamports: amount,
      status,
      blockTime: txDetails.blockTime
        ? new Date(txDetails.blockTime * 1000).toISOString()
        : null,
      slot: txDetails.slot,
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

module.exports = { verifyTransaction };
