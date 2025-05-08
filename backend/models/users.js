const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
