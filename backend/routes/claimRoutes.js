const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const auth = require("../middleware/authMiddleware");

// 🔹 SUBMIT A CLAIM/REQUEST
router.post("/:itemId", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const itemId = req.params.itemId;

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Prevent claiming your own item
    if (item.user && item.user.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot claim your own item" });
    }

    // Check if user already claimed this item
    const existingClaim = await Claim.findOne({ item: itemId, user: req.user.id });
    if (existingClaim) {
      return res.status(400).json({ message: "You have already submitted a request for this item" });
    }

    const claim = new Claim({
      item: itemId,
      user: req.user.id,
      message: message || "I am interested in this item.",
    });

    await claim.save();
    res.json({ message: "Request submitted successfully", claim });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 GET MY REQUESTS (Claims I made)
router.get("/my", auth, async (req, res) => {
  try {
    const claims = await Claim.find({ user: req.user.id })
      .populate("item", "title type location image status")
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 GET REQUESTS FOR MY ITEMS (Claims others made on my items)
router.get("/received", auth, async (req, res) => {
  try {
    // 1. Find all items owned by the current user
    const myItems = await Item.find({ user: req.user.id }).select("_id");
    const myItemIds = myItems.map(item => item._id);

    // 2. Find claims made on those items
    const claims = await Claim.find({ item: { $in: myItemIds } })
      .populate("item", "title type location image status")
      .populate("user", "name email") // Who requested it
      .sort({ createdAt: -1 });
      
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 UPDATE CLAIM STATUS (Accept/Reject)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const claimId = req.params.id;

    const claim = await Claim.findById(claimId).populate("item");
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // Only the owner of the item can update the claim status
    if (claim.item.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this claim" });
    }

    claim.status = status;
    await claim.save();

    // If accepted, mark the item as resolved and move it to "found"
    if (status === "accepted") {
      let updateData = { status: "resolved" };
      
      // If the original item was lost, the person who made the claim is the finder/helper.
      // So we change the item type to 'found' and record the helper.
      if (claim.item.type === "lost") {
        updateData.type = "found";
        updateData.helper = claim.user;
      } else if (claim.item.type === "found") {
        // If it was already found, the person who posted it is the helper.
        // We can just mark it resolved.
        updateData.helper = claim.item.user; 
      }
      
      await Item.findByIdAndUpdate(claim.item._id, updateData);
    }

    res.json({ message: `Claim ${status} successfully`, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
