const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect, authorizeEmployer } = require('../middleware/authMiddleware');

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', protect, authorizeEmployer, createJob);
router.put('/:id', protect, authorizeEmployer, updateJob);
router.delete('/:id', protect, authorizeEmployer, deleteJob);

module.exports = router;
