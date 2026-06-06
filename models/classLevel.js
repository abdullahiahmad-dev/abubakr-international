// models/ClassLevel.js
const mongoose = require("mongoose");

const classLevelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, required: true } // required so we always have an order
}, { timestamps: true });

module.exports = mongoose.model("ClassLevel", classLevelSchema);
