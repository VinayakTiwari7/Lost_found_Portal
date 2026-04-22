const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  type: {
    type: String,
    enum: ["lost", "found"],
    required: true,
  },
  location: String,
  image: String,
  status: {
    type: String,
    enum: ["pending_approval", "open", "resolved", "rejected"],
    default: "pending_approval",
  },
  adminNote: { type: String, default: "" }, // reason for rejection etc.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);