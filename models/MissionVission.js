const mongoose = require("mongoose");

const missionVisionSchema = new mongoose.Schema({
  type: { type: String, enum: ["mission", "vision"], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  points: [String], // bullet points (array of strings)
}, { timestamps: true });

module.exports = mongoose.model("MissionVision", missionVisionSchema);
