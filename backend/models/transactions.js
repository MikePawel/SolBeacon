const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, index: true },
  transactionHash: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  status: { type: String, enum: ["success", "failed"], required: true },
  blockTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
