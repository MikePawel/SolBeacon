const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  transactions: [
    {
      transactionHash: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

// Create a compound index to ensure transaction hashes are unique within a wallet
transactionSchema.index(
  { walletAddress: 1, "transactions.transactionHash": 1 },
  { unique: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
