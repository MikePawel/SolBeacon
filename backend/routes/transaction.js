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
 *         - transactionHash
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: Wallet address of the user
 *         transactionHash:
 *           type: string
 *           description: Transaction hash/signature from Solana
 *         amount:
 *           type: number
 *           description: Amount transferred in SOL
 *         sender:
 *           type: string
 *           description: Sender wallet address
 *         recipient:
 *           type: string
 *           description: Recipient wallet address
 *         status:
 *           type: string
 *           enum: [success, failed]
 *           description: Status of the transaction
 *         blockTime:
 *           type: string
 *           format: date-time
 *           description: Time when the transaction was confirmed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Time when transaction was recorded in database
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Record a new transaction
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
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input or transaction already exists
 *       404:
 *         description: User not found or transaction verification failed
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

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({
      transactionHash,
    });
    if (existingTransaction) {
      return res.status(400).json({
        message: "Transaction already exists",
      });
    }

    // Verify transaction on blockchain
    const txDetails = await verifyTransaction(transactionHash);

    // Create a new transaction record
    const transaction = new Transaction({
      walletAddress,
      transactionHash,
      amount: txDetails.amount,
      sender: txDetails.sender,
      recipient: txDetails.recipient,
      status: txDetails.status,
      blockTime: txDetails.blockTime,
    });

    // Save the transaction
    const savedTransaction = await transaction.save();

    // Update user balance transferred
    user.balanceTransferred += txDetails.amount;
    await user.save();

    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /transactions/{walletAddress}:
 *   get:
 *     summary: Get all transactions for a user
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
 *         description: List of user's transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: User not found
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

    // Get all transactions for the user
    const transactions = await Transaction.find({ walletAddress });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
