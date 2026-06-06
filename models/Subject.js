const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  classLevel: {
    type: String,
    enum: [
      "Pre-Nursery","Nursery 1","Nursery 2","Nursery 2B","Nursery 3",
      "Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6",
      "JSS 1","JSS 2","JSS 3", "SS 1", "SS 2", "SS 3"
    ],
    required: true
  },
  // Add stream field for SS classes
  stream: {
    type: String,
    enum: ["General", "Science", "Arts", "Commercial"],
    default: "General"
  },
  subjects: [{ type: String, required: true }]
}, { timestamps: true });

module.exports = mongoose.model("Subject", subjectSchema);