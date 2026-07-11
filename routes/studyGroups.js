const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const verifyFileSignature = require('../middleware/verifyFileSignature');
const {
  validateCreate,
  createStudyGroup,
  getAllStudyGroups,
  getStudyGroupById,
  joinStudyGroup,
  leaveStudyGroup,
  sendMessage,
  sendAudioMessage,
  deleteStudyGroup,
  validateSendMessage
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const groupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Max 5 groups per hour.' }
});


const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many messages. Slow down.' }
});

const audioLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many audio messages. Slow down.' }
});

// Public
router.get('/', getAllStudyGroups);
router.get('/:id', getStudyGroupById);

// Protected
router.post('/', protect, groupLimiter, validateCreate, createStudyGroup);
router.post('/:id/join', protect, joinStudyGroup);
router.post('/:id/leave', protect, leaveStudyGroup);
router.post('/:id/message', protect, messageLimiter, validateSendMessage, sendMessage);
router.post(
  '/:id/audio',
  protect,
  audioLimiter,
  upload.single('audio'),
  verifyFileSignature(['audio', 'video']),
  sendAudioMessage
);
router.delete('/:id', protect, deleteStudyGroup);

module.exports = router;