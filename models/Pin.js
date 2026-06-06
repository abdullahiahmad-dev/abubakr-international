// models/Pin.js
const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  term: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['unused', 'active', 'expired',],
    default: 'unused' 
  },
  usageCount: { type: Number, default: 0 },
  firstUsedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  usedBy: String,
  usedAt: Date,
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
}, { timestamps: true });

// Make sure to export the model correctly
module.exports = mongoose.model('Pin', pinSchema);