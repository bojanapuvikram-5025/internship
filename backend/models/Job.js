const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a job description']
  },
  qualifications: {
    type: String,
    required: [true, 'Please add qualifications']
  },
  responsibilities: {
    type: String,
    required: [true, 'Please add responsibilities']
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true
  },
  salaryMin: {
    type: Number,
    required: [true, 'Please add minimum salary']
  },
  salaryMax: {
    type: Number,
    required: [true, 'Please add maximum salary']
  },
  jobType: {
    type: String,
    required: [true, 'Please add a job type'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship']
  },
  experienceLevel: {
    type: String,
    required: [true, 'Please add experience level'],
    enum: ['Entry-level', 'Mid-level', 'Senior-level']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', jobSchema);
