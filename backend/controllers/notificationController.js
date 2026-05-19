const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications
// @access  Private
const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Employer sends an in-portal message/notification to a seeker
// @route   POST /api/notifications/send
// @access  Private (Employer only)
const sendNotification = async (req, res) => {
  try {
    const { seekerId, message } = req.body;

    if (!seekerId || !message) {
      return res.status(400).json({ success: false, message: 'Seeker ID and message are required' });
    }

    // Verify seeker exists
    const seeker = await User.findById(seekerId);
    if (!seeker) {
      return res.status(404).json({ success: false, message: 'Seeker not found' });
    }

    // Get sender (employer) name
    const senderName = req.user.name;

    // Create notification for the seeker
    await Notification.create({
      userId: seekerId,
      message: `📬 Message from ${senderName}: ${message}`
    });

    res.status(201).json({ success: true, message: 'Message sent to seeker successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNotifications, markNotificationsRead, sendNotification };
