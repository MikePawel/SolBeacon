const express = require("express");
const router = express.Router();
const User = require("../models/users");
module.exports = router;

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a user by wallet address
router.get("/:walletAddress", async (req, res) => {
  const user = await getUserByWalletAddress(req.params.walletAddress);
  res.status(200).json(user);
});

// delete a user by wallet address
router.delete("/:walletAddress", async (req, res) => {
  const user = await getUserByWalletAddress(req.params.walletAddress);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await user.deleteOne();
  res.status(200).json({ message: "User deleted" });
});

//create a user
router.post("/", async (req, res) => {
  const user = new User({
    walletAddress: req.body.walletAddress,
  });
  try {
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
