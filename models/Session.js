const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "2024/2025"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Session", sessionSchema);
