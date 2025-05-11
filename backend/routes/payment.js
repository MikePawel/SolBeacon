const express = require("express");
const router = express.Router();
const { sendSol } = require("../components/payer");
const { verifyTransaction } = require("../components/verifyTx");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
require("dotenv").config();

// Secret key for JWT signing - ideally from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the payment was successful
 *         signature:
 *           type: string
 *           description: Transaction signature
 *         recipientAddress:
 *           type: string
 *           description: Recipient wallet address (fixed to GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi)
 *         amount:
 *           type: number
 *           description: Amount of SOL sent
 *
 *     Payment:
 *       type: object
 *       properties:
 *         recipientAddress:
 *           type: string
 *           description: Wallet address to send SOL to
 *
 *     TransactionVerification:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the transaction verification was successful
 *         sender:
 *           type: string
 *           description: Sender wallet address
 *         recipient:
 *           type: string
 *           description: Recipient wallet address
 *         amount:
 *           type: number
 *           description: Amount of SOL transferred
 *         status:
 *           type: string
 *           description: Transaction status
 */

/**
 * @swagger
 * /payment:
 *   get:
 *     summary: Send 0.1 SOL to the fixed wallet if user has sufficient balance
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Insufficient balance
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - No token provided
 *       404:
 *         description: User not found
 *       500:
 *         description: Error sending payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    // Get user from database using the JWT token information
    const user = await User.findOne({ _id: req.user.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user has sufficient balance (at least 0.1)
    if (user.balanceTransferred < 0.1) {
      return res.status(400).json({
        success: false,
        error: "Insufficient balance",
        currentBalance: user.balanceTransferred,
        requiredBalance: 0.1,
      });
    }

    console.log("GET /payment - Processing payment request");

    // Send SOL to the fixed recipient
    const signature = await sendSol();

    // Update user's balance by subtracting 0.1
    user.balanceTransferred -= 0.1;
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      signature,
      recipientAddress: "GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi",
      amount: 0.1,
      remainingBalance: user.balanceTransferred,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /payment/verify/{txHash}:
 *   get:
 *     summary: Verify a Solana transaction and get sender, recipient, and amount
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: The transaction hash/signature to verify
 *     responses:
 *       200:
 *         description: Transaction verification successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionVerification'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - No token provided
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Error verifying transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/verify/:txHash", verifyToken, async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: "Transaction hash is required",
      });
    }

    console.log(`GET /payment/verify/${txHash} - Verifying transaction`);

    const transactionDetails = await verifyTransaction(txHash);

    res.status(200).json({
      success: true,
      ...transactionDetails,
    });
  } catch (error) {
    console.error("Transaction verification error:", error);

    // Handle specific error for transaction not found
    if (error.message === "Transaction not found") {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Middleware to verify JWT token
 */
function verifyToken(req, res, next) {
  // Get auth header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Extract token (Bearer format: "Bearer TOKEN")
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Invalid token format" });
  }

  // Verify token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Add decoded user info to request
    req.user = decoded;
    next();
  });
}

module.exports = router;
