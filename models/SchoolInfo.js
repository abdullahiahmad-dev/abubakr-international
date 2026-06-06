// models/SchoolInfo.js
const mongoose = require('mongoose');

const schoolInfoSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  term: {
    type: String,
    enum: ['First Term', 'Second Term', 'Third Term'],
    required: true
  },
  nextTermResumption: {
    type: Date,
    required: true
  },
  // --- UPDATED FEE STRUCTURE ---
  nurseryFees: {
    type: Number,
    required: true
  },
  primaryFees: {
    type: Number,
    required: true
  },
  juniorSecondaryFees: {
    type: Number,
    required: true
  },
  seniorSecondaryFees: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
schoolInfoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SchoolInfo', schoolInfoSchema);