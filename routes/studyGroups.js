const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  validateCreate,
  createStudyGroup,
  getAllStudyGroups,
  getStudyGroupById,
  joinStudyGroup,
  leaveStudyGroup,
  sendMessage,
  sendAudioMessage,
  deleteStudyGroup
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const groupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Max 5 groups per hour.' }
});

// Public
router.get('/', getAllStudyGroups);
router.get('/:id', getStudyGroupById);

// Protected
router.post('/', protect, groupLimiter, validateCreate, createStudyGroup);
router.post('/:id/join', protect, joinStudyGroup);
router.post('/:id/leave', protect, leaveStudyGroup);
router.post('/:id/message', protect, sendMessage);
router.post('/:id/audio', protect, upload.single('audio'), sendAudioMessage);
router.delete('/:id', protect, deleteStudyGroup);

module.exports = router;