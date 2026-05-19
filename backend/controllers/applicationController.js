const Application = require('../models/Application');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Seeker only)
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Please provide a Job ID' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    // Check if user already applied
    const alreadyApplied = await Application.findOne({
      jobId,
      applicantId: req.user._id
    });
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    // Determine resume URL
    let resumeUrl = '';

    // If file uploaded directly in apply request
    if (req.file) {
      resumeUrl = `/uploads/${req.file.filename}`;
      // Proactively update user's profile with this resume URL as well
      await Profile.findOneAndUpdate(
        { userId: req.user._id },
        { resumeUrl },
        { new: true }
      );
    } else {
      // Check if user has resume in profile
      const profile = await Profile.findOne({ userId: req.user._id });
      if (profile && profile.resumeUrl) {
        resumeUrl = profile.resumeUrl;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please upload a resume first or attach one to this application'
        });
      }
    }

    // Create Application
    const application = await Application.create({
      jobId,
      applicantId: req.user._id,
      resumeUrl
    });

    // Notify Employer
    await Notification.create({
      userId: job.employerId,
      message: `New application received for "${job.title}" from ${req.user.name}.`
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
const getUserApplications = async (req, res) => {
  try {
    if (req.user.role === 'seeker') {
      // Get applications submitted by this job seeker
      const applications = await Application.find({ applicantId: req.user._id })
        .populate({
          path: 'jobId',
          populate: { path: 'employerId', select: 'name email' }
        })
        .sort({ appliedAt: -1 });

      return res.json({ success: true, count: applications.length, data: applications });
    } else if (req.user.role === 'employer') {
      // Get all applications for jobs posted by this employer
      const employerJobs = await Job.find({ employerId: req.user._id });
      const jobIds = employerJobs.map((job) => job._id);

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('jobId', 'title location salaryMin salaryMax jobType')
        .populate('applicantId', 'name email')
        .sort({ appliedAt: -1 });

      // Populate applicant profile details manually for rich details
      const populatedApplications = await Promise.all(
        applications.map(async (app) => {
          const profile = await Profile.findOne({ userId: app.applicantId._id });
          return {
            ...app.toObject(),
            applicantProfile: profile ? {
              phone: profile.phone,
              skills: profile.skills,
              education: profile.education,
              experience: profile.experience,
              resumeUrl: profile.resumeUrl
            } : null
          };
        })
      );

      return res.json({
        success: true,
        count: populatedApplications.length,
        data: populatedApplications
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private (Employer only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Shortlisted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (Shortlisted or Rejected)'
      });
    }

    const application = await Application.findById(req.params.id).populate('jobId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify ownership: Job's employer must match logged in user
    if (application.jobId.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this application status'
      });
    }

    application.status = status;
    await application.save();

    // Notify Seeker
    await Notification.create({
      userId: application.applicantId,
      message: `Your application for "${application.jobId.title}" has been ${status.toLowerCase()}!`
    });

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  applyForJob,
  getUserApplications,
  updateApplicationStatus
};
