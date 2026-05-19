const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationsRead, sendNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/', protect, markNotificationsRead);
router.post('/send', protect, sendNotification);

module.exports = router;
