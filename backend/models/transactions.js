const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, unique: true },
    transactions: [{ type: String }],
  },
  { timestamps: true }
);

// Create an index for faster lookups
transactionSchema.index({ walletAddress: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
