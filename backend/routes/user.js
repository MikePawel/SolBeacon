const express = require("express");
const router = express.Router();
const User = require("../models/users");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Secret key for JWT signing - ideally from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

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
 *         password:
 *           type: string
 *           description: Password of the user (not required initially)
 *         deviceID:
 *           type: string
 *           description: Device ID of the user (not required initially)
 *         balanceTransferred:
 *           type: number
 *           description: Amount of balance transferred by the user
 *           default: 0
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
// Get all users - No longer requires token
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
// Get a user by wallet address - No longer requires token
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
// delete a user by wallet address - No longer requires token
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

/**
 * @swagger
 * /users/{walletAddress}/password:
 *   post:
 *     summary: Set a password for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password to set for the user
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid input data
 */
// Set password for a user
router.post("/:walletAddress/password", async (req, res) => {
  try {
    const user = await getUserByWalletAddress(req.params.walletAddress);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.body.password) {
      return res.status(400).json({ message: "Password is required" });
    }

    user.password = req.body.password;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/deviceID:
 *   post:
 *     summary: Set a device ID for a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceID
 *               - email
 *               - password
 *             properties:
 *               deviceID:
 *                 type: string
 *                 description: Device ID to set for the user
 *               email:
 *                 type: string
 *                 description: Email for authentication
 *               password:
 *                 type: string
 *                 description: Password for authentication
 *     responses:
 *       200:
 *         description: Device ID set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication failed
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid input data
 */
// Set device ID for a user using email
router.post("/deviceID", async (req, res) => {
  try {
    // Verify required fields
    if (!req.body.email || !req.body.password || !req.body.deviceID) {
      return res
        .status(400)
        .json({ message: "Email, password, and deviceID are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password matches
    if (!user.password || user.password !== req.body.password) {
      return res
        .status(401)
        .json({ message: "Authentication failed: Password incorrect" });
    }

    user.deviceID = req.body.deviceID;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Authenticate a user and return a JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email of the user
 *               password:
 *                 type: string
 *                 description: Password of the user
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication failed
 *       404:
 *         description: User not found
 */
router.post("/login", async (req, res) => {
  try {
    // Validate request body
    if (!req.body.email || !req.body.password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    if (!user.password || user.password !== req.body.password) {
      return res
        .status(401)
        .json({ message: "Authentication failed: Invalid credentials" });
    }

    // Update last login time
    user.loggedInAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
      },
      JWT_SECRET
    );

    // Return token and user information
    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/protected:
 *   get:
 *     summary: Example of a protected route requiring JWT authentication
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Protected data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You accessed protected data"
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     walletAddress:
 *                       type: string
 *                       example: "0x1234567890abcdef"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - No token provided
 */
router.get("/protected", verifyToken, async (req, res) => {
  // User data is available in req.user
  res.status(200).json({
    message: "You accessed protected data",
    user: req.user,
  });
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

async function getUserByWalletAddress(walletAddress) {
  try {
    const user = await User.findOne({ walletAddress });
    return user;
  } catch (error) {
    return null;
  }
}
