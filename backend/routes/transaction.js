const express = require("express");
const router = express.Router();
const Transaction = require("../models/transactions");
const User = require("../models/users");
const { verifyTransaction } = require("../components/verifyTx");

// The recipient address that we accept payments to
const ACCEPTED_RECIPIENT = "GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi";

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - walletAddress
 *         - transactions
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: Wallet address of the user
 *         transactions:
 *           type: array
 *           description: List of transaction hashes
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Record a new transaction hash for a user
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - transactionHash
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: User's wallet address
 *               transactionHash:
 *                 type: string
 *                 description: Transaction hash/signature from Solana
 *     responses:
 *       201:
 *         description: Transaction recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 walletAddress:
 *                   type: string
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 amountTransferred:
 *                   type: number
 *                   description: Amount transferred in this transaction
 *                 totalBalanceTransferred:
 *                   type: number
 *                   description: Total balance transferred by the user
 *       400:
 *         description: Invalid input, transaction already exists, or verification failed
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  try {
    const { walletAddress, transactionHash } = req.body;

    // Step 1: Check if required fields are present
    if (!walletAddress || !transactionHash) {
      return res.status(400).json({
        message: "Wallet address and transaction hash are required",
      });
    }

    // Step 2: Check if user exists (wallet address exists in users collection)
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        message: "User not found. Please register first.",
      });
    }

    // Step 3: Check if this transaction has already been processed for this user
    const existingTransaction = await Transaction.findOne({
      walletAddress,
      transactions: { $in: [transactionHash] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        message: "This transaction has already been processed",
      });
    }

    // Step 4: Verify the transaction on the blockchain
    const txDetails = await verifyTransaction(transactionHash);

    // Step 5: Check if verification was successful
    if (!txDetails.success) {
      return res.status(400).json({
        message: `Transaction verification failed: ${txDetails.message}`,
      });
    }

    // Step 6: Verify transaction status is "success"
    if (txDetails.status !== "success") {
      return res.status(400).json({
        message: "Transaction was not successful on the blockchain",
      });
    }

    // Step 7: Verify sender address matches the wallet address that was provided
    if (txDetails.sender !== walletAddress) {
      return res.status(400).json({
        message:
          "Transaction sender does not match the provided wallet address",
      });
    }

    // Step 8: Verify recipient is the accepted payment address
    if (txDetails.recipient !== ACCEPTED_RECIPIENT) {
      return res.status(400).json({
        message: "Transaction recipient is not the accepted payment address",
      });
    }

    // Step 9: Store the transaction hash in the transactions collection
    let walletTransactions = await Transaction.findOne({ walletAddress });

    if (walletTransactions) {
      // Add new transaction hash to the array
      walletTransactions.transactions.push(transactionHash);
    } else {
      // Create new wallet transaction record
      walletTransactions = new Transaction({
        walletAddress,
        transactions: [transactionHash],
      });
    }

    await walletTransactions.save();

    // Step 10: Update the user's balanceTransferred field with the amount from the transaction
    const previousBalance = user.balanceTransferred;
    user.balanceTransferred += txDetails.amount;
    await user.save();

    // Step 11: Return the response with transaction details
    const response = {
      walletAddress,
      transactions: walletTransactions.transactions,
      amountTransferred: txDetails.amount,
      previousBalance: previousBalance,
      totalBalanceTransferred: user.balanceTransferred,
      transactionDetails: {
        sender: txDetails.sender,
        recipient: txDetails.recipient,
        amount: txDetails.amount,
        status: txDetails.status,
        blockTime: txDetails.blockTime,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({
      message: "An error occurred while processing the transaction",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /transactions/{walletAddress}:
 *   get:
 *     summary: Get all transaction hashes for a user
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: List of transaction hashes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 walletAddress:
 *                   type: string
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 totalBalanceTransferred:
 *                   type: number
 *       404:
 *         description: User or transaction record not found
 *       500:
 *         description: Server error
 */
router.get("/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Check if user exists
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get transaction record for the user
    const transactionRecord = await Transaction.findOne({ walletAddress });

    if (!transactionRecord) {
      // Return an empty array if no transactions but user exists
      return res.status(200).json({
        walletAddress,
        transactions: [],
        totalBalanceTransferred: user.balanceTransferred,
      });
    }

    // Return response with transaction hashes and balance
    const response = {
      walletAddress: transactionRecord.walletAddress,
      transactions: transactionRecord.transactions,
      totalBalanceTransferred: user.balanceTransferred,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    res.status(500).json({
      message: "An error occurred while retrieving transactions",
      error: error.message,
    });
  }
});

module.exports = router;
