const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, unique: true },
  balanceTransferred: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  loggedInAt: { type: Date },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
