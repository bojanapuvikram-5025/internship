const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getUserApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorizeSeeker, authorizeEmployer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, authorizeSeeker, upload.single('resume'), applyForJob);
router.get('/', protect, getUserApplications);
router.put('/:id', protect, authorizeEmployer, updateApplicationStatus);

module.exports = router;
