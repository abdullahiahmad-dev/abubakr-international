const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  adminNo: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female"], required: true },
  dob: { type: Date, required: true },
  classLevel: { 
    type: String, 
    enum: [
      "Pre-Nursery","Nursery 1","Nursery 2","Nursery 2B","Nursery 3",
      "Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6",
      "JSS 1","JSS 2","JSS 3", "SS 1", "SS 2", "SS 3"
    ],
    required: true 
  },
  // Add stream for SS students
  stream: {
    type: String,
    enum: ["Science", "Arts", "Commercial"],
    required: function() {
      return this.classLevel.startsWith("SS");
    }
  },
  parentName: String,
  parentPhone: String,
  address: String,
  photoUrl: String
}, { timestamps: true });
module.exports = mongoose.model("Student", studentSchema);
