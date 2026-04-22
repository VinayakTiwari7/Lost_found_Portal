const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const auth = require("../middleware/authMiddleware");


// 🔹 ADD ITEM (Protected) — starts as "pending_approval"
router.post("/add", auth, async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      user: req.user.id,
      status: "pending_approval", // always starts pending
    });

    await item.save();

    res.json({
      message: "Item submitted for admin review. It will appear publicly once approved.",
      item,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 GET ALL PUBLIC ITEMS (open + resolved only)
router.get("/", async (req, res) => {
  try {
    const items = await Item.find({ status: { $in: ["open", "resolved"] } })
      .populate("user", "name email")
      .populate("helper", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 GET MY ITEMS (all statuses — so user can see pending/rejected too)
router.get("/mine", auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user.id })
      .populate("user", "name email")
      .populate("helper", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 DELETE ITEM — owner only (admin uses /api/admin/items/:id)
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Only the item owner can delete their own item
    if (item.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this item" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;