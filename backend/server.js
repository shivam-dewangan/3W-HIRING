const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const User = require("./models/User");
const History = require("./models/History");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Adjusted for your frontend port
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions)); // Apply CORS middleware
app.use(bodyParser.json()); // Parse incoming JSON requests

// Serve static frontend build files (assuming the build is located in backend/public)
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath)); // Serve static files from 'public' directory

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Routes

// Add User
app.post("/api/users", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const user = new User({ name });
    await user.save();
    res.status(201).json({ message: "User added successfully", data: user });
  } catch (error) {
    console.error("Error adding user:", error.message);
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error", error });
  }
});

// Claim Random Points
app.post("/api/claim", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const points = Math.floor(Math.random() * 10) + 1; // Random points between 1 and 10

    // Update User's Total Points
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", data: null });

    user.totalPoints += points;
    await user.save();

    // Save Claim History
    const history = new History({ userId, pointsAwarded: points });
    await history.save();

    const updatedUser = await User.findById(userId);
    const historyData = await History.find({ userId })
      .populate("userId", "name")
      .sort({ timestamp: -1 });

    res.status(200).json({
      message: "Points claimed successfully",
      data: { points, updatedUser, historyData },
    });
  } catch (error) {
    console.error("Error during claim points:", error.message);
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch Claim Points History
app.get("/api/history", async (req, res) => {
  try {
    const history = await History.find().populate("userId", "name").sort({ timestamp: -1 });
    res.status(200).json({ data: history });
  } catch (error) {
    console.error("Error fetching claim history:", error.message);
    res.status(500).json({ message: "Server error", error });
  }
});

// Serve React frontend for unmatched routes (React Router fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
