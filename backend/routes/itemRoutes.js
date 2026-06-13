const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const auth = require("../middleware/authMiddleware");


const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// 🔹 ADD ITEM (Protected) — starts as "pending_approval"
router.post("/add", auth, upload.single("imageFile"), async (req, res) => {
  try {
    let imageUrl = req.body.image; // Assume existing URL string
    if (req.file) {
      // If a file was uploaded, use the new file path
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = new Item({
      ...req.body,
      image: imageUrl,
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

// 🔹 SELF-RESOLVE ITEM — owner only
router.patch("/:id/resolve", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Only the item owner can self-resolve
    if (item.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to resolve this item" });
    }

    if (item.status === "resolved") {
      return res.status(400).json({ message: "Item is already resolved" });
    }

    item.status = "resolved";
    // We can set helper to the user themselves to indicate self-resolution
    item.helper = req.user.id; 
    
    // Auto-reject any pending claims for this item
    const Claim = require("../models/Claim");
    await Claim.updateMany(
      { item: item._id, status: "pending" },
      { $set: { status: "rejected" } }
    );

    await item.save();
    res.json({ message: "Item marked as resolved successfully", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;