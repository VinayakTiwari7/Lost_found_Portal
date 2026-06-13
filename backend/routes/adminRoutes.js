const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// All routes here require auth + admin role
router.use(auth, admin);

// ─────────────────────────────────────────────
// 📊 STATS
// ─────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [
      totalItems,
      pendingItems,
      openItems,
      resolvedItems,
      rejectedItems,
      totalUsers,
      totalClaims,
      pendingClaims,
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ status: "pending_approval" }),
      Item.countDocuments({ status: "open" }),
      Item.countDocuments({ status: "resolved" }),
      Item.countDocuments({ status: "rejected" }),
      User.countDocuments(),
      Claim.countDocuments(),
      Claim.countDocuments({ status: "pending" }),
    ]);

    res.json({
      totalItems,
      pendingItems,
      openItems,
      resolvedItems,
      rejectedItems,
      totalUsers,
      totalClaims,
      pendingClaims,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// 📦 ITEM MANAGEMENT
// ─────────────────────────────────────────────

// Get all items (any status)
router.get("/items", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await Item.find(filter)
      .populate("user", "name email")
      .populate("helper", "name email")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve item
router.patch("/items/:id/approve", async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: "open", adminNote: "" },
      { new: true }
    ).populate("user", "name email");

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item approved successfully", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject item
router.patch("/items/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", adminNote: reason || "Does not meet guidelines" },
      { new: true }
    ).populate("user", "name email");

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item rejected", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hard delete item (admin can delete any item)
router.delete("/items/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    // Also remove all associated claims
    await Claim.deleteMany({ item: req.params.id });
    res.json({ message: "Item and its claims deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// 📋 CLAIM MANAGEMENT
// ─────────────────────────────────────────────

// Get all claims
router.get("/claims", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const claims = await Claim.find(filter)
      .populate("item", "title type location status")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin override claim status
router.patch("/claims/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("item").populate("user", "name email");

    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // If accepting, resolve the item too
    if (status === "accepted" && claim.item) {
      let updateData = { status: "resolved" };
      if (claim.item.type === "lost") {
        updateData.type = "found";
        updateData.helper = claim.user;
      } else {
        updateData.helper = claim.item.user;
      }
      await Item.findByIdAndUpdate(claim.item._id, updateData);
    }

    res.json({ message: `Claim marked as ${status}`, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a claim
router.delete("/claims/:id", async (req, res) => {
  try {
    const claim = await Claim.findByIdAndDelete(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Claim deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// 👥 USER MANAGEMENT
// ─────────────────────────────────────────────

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promote or demote user role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user.id && role === "user") {
      return res.status(400).json({ message: "You cannot demote yourself" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }
    await User.findByIdAndDelete(req.params.id);
    // Optionally clean up items/claims
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
