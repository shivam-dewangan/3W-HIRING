const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User");
const History = require("./models/History");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the app if connection fails
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
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch User by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", data: null });
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update User Name
app.put("/api/users/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", data: null });

    user.name = name;
    await user.save();
    res.status(200).json({ message: "User updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", data: null });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Claim Random Points
app.post("/api/claim", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const points = Math.floor(Math.random() * 10) + 1; // Random points (1-10)

    // Update User's Total Points
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", data: null });

    user.totalPoints += points;
    await user.save();

    // Save Claim History
    const history = new History({ userId, pointsAwarded: points });
    await history.save();

    // Fetch updated user data and history
    const updatedUser = await User.findById(userId);
    const historyData = await History.find({ userId }).populate("userId", "name").sort({ timestamp: -1 });

    res.status(200).json({
      message: "Points claimed successfully",
      data: { points, updatedUser, historyData }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch Claim Points History
app.get("/api/history", async (req, res) => {
  try {
    const history = await History.find().populate("userId", "name").sort({ timestamp: -1 });
    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
