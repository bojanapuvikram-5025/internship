const Job = require('../models/Job');
const Profile = require('../models/Profile');

// @desc    Get all jobs (with optional search and filters)
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const { keyword, location, jobType, experienceLevel, salaryMin } = req.query;
    let query = {};

    // Search keyword (matches title or description)
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filter location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter job type
    if (jobType) {
      query.jobType = jobType;
    }

    // Filter experience level
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    // Filter minimum salary
    if (salaryMin) {
      query.salaryMax = { $gte: Number(salaryMin) };
    }

    // Find jobs and populate employer information
    const jobs = await Job.find(query)
      .populate('employerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single job details
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employerId', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    // Fetch employer company details
    const employerProfile = await Profile.findOne({ userId: job.employerId._id });

    res.json({
      success: true,
      data: job,
      employer: {
        companyName: employerProfile ? employerProfile.companyName : '',
        industry: employerProfile ? employerProfile.industry : '',
        website: employerProfile ? employerProfile.website : '',
        companyDesc: employerProfile ? employerProfile.companyDesc : ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a job listing
// @route   POST /api/jobs
// @access  Private (Employer only)
const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      qualifications,
      responsibilities,
      location,
      salaryMin,
      salaryMax,
      jobType,
      experienceLevel
    } = req.body;

    if (
      !title ||
      !description ||
      !qualifications ||
      !responsibilities ||
      !location ||
      !salaryMin ||
      !salaryMax ||
      !jobType ||
      !experienceLevel
    ) {
      return res.status(400).json({ success: false, message: 'Please provide all job fields' });
    }

    const job = await Job.create({
      employerId: req.user._id,
      title,
      description,
      qualifications,
      responsibilities,
      location,
      salaryMin,
      salaryMax,
      jobType,
      experienceLevel
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a job listing
// @route   PUT /api/jobs/:id
// @access  Private (Employer only)
const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    // Check ownership
    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job listing'
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a job listing
// @route   DELETE /api/jobs/:id
// @access  Private (Employer only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    // Check ownership
    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job listing'
      });
    }

    await job.deleteOne();

    res.json({ success: true, message: 'Job listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
