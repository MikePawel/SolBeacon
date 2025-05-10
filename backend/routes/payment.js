const express = require("express");
const router = express.Router();
const { sendSol } = require("../components/payer");
const { verifyTransaction } = require("../components/verifyTx");

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
 *     summary: Send 0.1 SOL to the fixed wallet (GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Payment sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
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
router.get("/", async (req, res) => {
  try {
    // Only initialize Solana connection when endpoint is called
    console.log("GET /payment - Processing payment request");

    // Send SOL to the fixed recipient
    const signature = await sendSol();

    // Return success response
    res.status(200).json({
      success: true,
      signature,
      recipientAddress: "GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi",
      amount: 0.1,
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
router.get("/verify/:txHash", async (req, res) => {
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

module.exports = router;
