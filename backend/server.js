const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://lost-found-portal-two.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

const path = require("path");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Lost & Found API is running");
});

app.get("/api/health", (req, res) => {
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({ status: "ok", database: states[mongoose.connection.readyState] || "unknown" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ MONGO_URL not defined in .env");
  process.exit(1);
}

mongoose.set('bufferTimeoutMS', 30000);

async function startServer() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected, state:", mongoose.connection.readyState);

    const User = require("./models/User");
    const testCount = await User.countDocuments();
    console.log("✅ Model test OK — users in DB:", testCount);

    app.listen(PORT, () => {
      console.log(`🚀 HTTP Server → http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// ── Vercel Serverless Execution ──────────────────────────────────────────
if (process.env.VERCEL) {
  // Vercel provides a serverless environment, so we don't start our own server.
  // Instead, we just ensure MongoDB is connected, and export the Express app.
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    }).then(() => console.log("✅ MongoDB Connected (Vercel Serverless)"))
      .catch(err => console.error("❌ MongoDB connection error:", err.message));
  }
} else {
  // Local Development Execution
  startServer();
}

module.exports = app;