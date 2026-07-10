const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const verifyFileSignature = require('../middleware/verifyFileSignature');
const {
  validateCreate,
  validateVote,
  validateReply,
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
  voteDifficulty,
  addReply,
  markReplyUseful,
  likeReply
} = require('../controllers/helpRequestController');
const { protect, optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests. Max 10 per hour.' }
});

// Public
router.get('/', getAllHelpRequests);
router.get('/:id', getHelpRequestById);
router.post('/:id/vote', optionalAuth, validateVote, voteDifficulty);

// Protected
router.post(
  '/',
  protect,
  createLimiter,
  upload.array('images', 5),
  verifyFileSignature(['image']),
  validateCreate,
  createHelpRequest
);
router.put(
  '/:id',
  protect,
  createLimiter,
  upload.array('images', 5),
  verifyFileSignature(['image']),
  updateHelpRequest
);
router.delete('/:id', protect, createLimiter, deleteHelpRequest);
router.post(
  '/:id/reply',
  protect,
  createLimiter,
  upload.single('image'),
  verifyFileSignature(['image']),
  validateReply,
  addReply
);
router.put('/:id/reply/:replyId/useful', protect, createLimiter, markReplyUseful);
router.post('/:id/reply/:replyId/like', protect, createLimiter, likeReply);

module.exports = router;