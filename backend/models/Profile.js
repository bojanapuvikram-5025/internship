const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Fields for Job Seeker & Employer
  phone: {
    type: String,
    trim: true
  },
  // Job Seeker Profile Details
  skills: {
    type: [String],
    default: []
  },
  education: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String,
    trim: true
  },
  // Employer Profile Details
  companyName: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  companyDesc: {
    type: String,
    trim: true
  }
});

module.exports = mongoose.model('Profile', profileSchema);
