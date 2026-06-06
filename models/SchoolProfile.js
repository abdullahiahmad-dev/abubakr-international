const mongoose = require('mongoose');

const schoolProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Abubakr International School'
  },
  address: {
    type: String,
    required: true,
    default: 'No. 8 School Road, Abakwa Kaduna, Nigeria'
  },
  motto: {
    type: String,
    required: true,
    default: 'Striving for Excellence'
  },
  logoUrl: {
    type: String,
    required: true,
    default: '/css/logo.png' // A default local logo path
  },
  phoneNumbers: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

schoolProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SchoolProfile', schoolProfileSchema);