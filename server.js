const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
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

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({ status: "ok", database: states[mongoose.connection.readyState] || "unknown" });
});

const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;
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

    // ── HTTP Server (always starts) ──────────────────────────────────────
    http.createServer(app).listen(PORT, () => {
      console.log(`🚀 HTTP  Server → http://localhost:${PORT}`);
    });

    // ── HTTPS Server (starts only if certs are present) ──────────────────
    const keyPath  = process.env.SSL_KEY_PATH  || path.join(__dirname, "certs", "localhost-key.pem");
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, "certs", "localhost.pem");

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const sslOptions = {
        key:  fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
        console.log(`🔒 HTTPS Server → https://localhost:${HTTPS_PORT}`);
      });
    } else {
      console.log("ℹ️  No SSL certs found — HTTPS skipped. Run 'npm run gen-certs' to enable.");
    }

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