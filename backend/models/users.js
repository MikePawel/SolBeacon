const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, unique: true },
  password: { type: String },
  balanceTransferred: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  loggedInAt: { type: Date },
});

// Create index for email field
userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
