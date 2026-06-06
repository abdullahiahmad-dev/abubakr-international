const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "teacher", enum: ["teacher", "admin"] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Teacher", teacherSchema);
