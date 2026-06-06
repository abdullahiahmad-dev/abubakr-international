const mongoose = require("mongoose");

const psychomotorSchema = new mongoose.Schema({
  punctuality: { type: Number, min: 1, max: 5 },
  independency: { type: Number, min: 1, max: 5 },
  physicalHealth: { type: Number, min: 1, max: 5 },
  classroomBehaviour: { type: Number, min: 1, max: 5 },
  homework: { type: Number, min: 1, max: 5 },
  selfControl: { type: Number, min: 1, max: 5 },
  relationship: { type: Number, min: 1, max: 5 },
  spokenEnglish: { type: Number, min: 1, max: 5 },
  schoolProperty: { type: Number, min: 1, max: 5 },
  creativity: { type: Number, min: 1, max: 5 },
  attentiveness: { type: Number, min: 1, max: 5 },
  emotionalStability: { type: Number, min: 1, max: 5 },
  cleanliness: { type: Number, min: 1, max: 5 },
  gamesSports: { type: Number, min: 1, max: 5 },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  classLevel: { type: String, required: true },
 session: { type: mongoose.Schema.Types.ObjectId, ref: "Session" }, // 👈 important
  term: { type: String, required: true },
  subject: { type: String, required: true },
  firstCA: { type: Number, default: 0 },
  secondCA: { type: Number, default: 0 },
  exam: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  grade: { type: String },

  // New fields
  psychomotor: psychomotorSchema,
  daysPresent: { type: Number, default: 0 },
  daysAbsent: { type: Number, default: 0 },
  overallGrade: { type: String },
  generalConduct: { type: String },
  formTeacherRemark: { type: String },
  principalRemark: { type: String }
});

module.exports = mongoose.model("Result", resultSchema);
