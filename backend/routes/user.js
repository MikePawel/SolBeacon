const express = require("express");
const router = express.Router();
const User = require("../models/users");
module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - walletAddress
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the user
 *         email:
 *           type: string
 *           description: Email of the user
 *         walletAddress:
 *           type: string
 *           description: Wallet address of the user
 *         createdAt:
 *           type: string
 *           format: date
 *           description: Date when user was created
 *         loggedInAt:
 *           type: string
 *           format: date
 *           description: Date when user last logged in
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/{walletAddress}:
 *   get:
 *     summary: Get a user by wallet address
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
// Get a user by wallet address
router.get("/:walletAddress", async (req, res) => {
  const user = await getUserByWalletAddress(req.params.walletAddress);
  res.status(200).json(user);
});

/**
 * @swagger
 * /users/{walletAddress}:
 *   delete:
 *     summary: Delete a user by wallet address
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
// delete a user by wallet address
router.delete("/:walletAddress", async (req, res) => {
  const user = await getUserByWalletAddress(req.params.walletAddress);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await user.deleteOne();
  res.status(200).json({ message: "User deleted" });
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Sign up or log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - walletAddress
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user
 *               email:
 *                 type: string
 *                 description: Email of the user
 *               walletAddress:
 *                 type: string
 *                 description: Wallet address of the user
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 */
// Sign up or log in a user
router.post("/", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      user.loggedInAt = new Date();
      await user.save();
      return res.status(200).json(user);
    }
    user = new User({
      name: req.body.name,
      email: req.body.email,
      walletAddress: req.body.walletAddress,
      loggedInAt: new Date(),
    });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

async function getUserByWalletAddress(walletAddress) {
  try {
    const user = await User.findOne({ walletAddress });
    return user;
  } catch (error) {
    return null;
  }
}
