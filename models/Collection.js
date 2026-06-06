// models/Collection.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  collectedBy: { type: String, default: 'Admin' }, // Changed from ObjectId to String
  note: { type: String }
});

const collectionSchema = new mongoose.Schema({
  personName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  collectedAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'partially paid', 'completed'],
    default: 'pending'
  },
  createdBy: { type: String, default: 'Admin' }, // Changed from ObjectId to String
  paymentHistory: [paymentSchema]
}, { timestamps: true });

collectionSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.collectedAmount;
  
  if (this.remainingAmount <= 0) {
    this.status = 'completed';
    this.remainingAmount = 0;
  } else if (this.collectedAmount > 0) {
    this.status = 'partially paid';
  } else {
    this.status = 'pending';
  }
  
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);