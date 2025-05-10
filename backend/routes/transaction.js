const express = require("express");
const router = express.Router();
const Transaction = require("../models/transactions");
const User = require("../models/users");
const { verifyTransaction } = require("../components/verifyTx");

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
 *             type: object
 *             properties:
 *               transactionHash:
 *                 type: string
 *                 description: Transaction hash/signature from Solana
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: Time when transaction was recorded
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
 *       400:
 *         description: Invalid input or transaction already exists
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  try {
    const { walletAddress, transactionHash } = req.body;

    // Check if required fields are present
    if (!walletAddress || !transactionHash) {
      return res.status(400).json({
        message: "Wallet address and transaction hash are required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify transaction on blockchain
    await verifyTransaction(transactionHash);

    // Check if transaction record for this wallet exists
    let walletTransactions = await Transaction.findOne({ walletAddress });

    // Check if transaction hash already exists
    if (walletTransactions) {
      if (walletTransactions.transactions.includes(transactionHash)) {
        return res.status(400).json({
          message: "Transaction hash already exists for this wallet",
        });
      }

      // Add new transaction hash to the array
      walletTransactions.transactions.push(transactionHash);
    } else {
      // Create new wallet transaction record
      walletTransactions = new Transaction({
        walletAddress,
        transactions: [transactionHash],
      });
    }

    // Save the transaction
    await walletTransactions.save();

    // Update user balance transferred
    user.balanceTransferred += 1; // Increment by 1 for each transaction
    await user.save();

    // Return the simplified response
    const simplifiedResponse = {
      walletAddress: walletTransactions.walletAddress,
      transactions: walletTransactions.transactions,
    };

    res.status(201).json(simplifiedResponse);
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({
        message: "No transaction records found for this wallet",
      });
    }

    // Simplify the response to just include transaction hashes
    const simplifiedResponse = {
      walletAddress: transactionRecord.walletAddress,
      transactions: transactionRecord.transactions.map(
        (tx) => tx.transactionHash
      ),
    };

    res.status(200).json(simplifiedResponse);
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
