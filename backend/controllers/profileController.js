const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role'
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Capture fields
    const {
      phone,
      skills,
      education,
      experience,
      companyName,
      industry,
      website,
      companyDesc,
      name // Option to update name as well
    } = req.body;

    // Update fields in Profile
    if (phone !== undefined) profile.phone = phone;
    if (education !== undefined) profile.education = education;
    if (experience !== undefined) profile.experience = experience;
    if (companyName !== undefined) profile.companyName = companyName;
    if (industry !== undefined) profile.industry = industry;
    if (website !== undefined) profile.website = website;
    if (companyDesc !== undefined) profile.companyDesc = companyDesc;

    if (skills !== undefined) {
      // Handle skills array/string conversion
      if (Array.isArray(skills)) {
        profile.skills = skills;
      } else if (typeof skills === 'string') {
        profile.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    // Handle resume file upload if uploaded
    if (req.file) {
      profile.resumeUrl = `/uploads/${req.file.filename}`;
    }

    await profile.save();

    // Update user's name in User collection if provided
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    // Fetch updated profile populated
    const updatedProfile = await Profile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role'
    );

    res.json({ success: true, data: updatedProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile };
