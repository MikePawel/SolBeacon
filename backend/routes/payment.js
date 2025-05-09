const express = require("express");
const router = express.Router();
const { sendSol } = require("../payer");

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
 */

/**
 * @swagger
 * /payment/send:
 *   post:
 *     summary: Send 0.1 SOL to the fixed wallet address (GETgWrW67ADQtc1Udv4xK3ykwtJDyVw7gzJXEDLvDSZi)
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
router.post("/send", async (req, res) => {
  try {
    // Only initialize Solana connection when endpoint is called
    console.log("POST /payment/send - Processing payment request");

    // Send SOL to the fixed recipient address
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

module.exports = router;
