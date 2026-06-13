const express = require('express');
const router = express.Router();
const {
  validateMessage,
  getRooms,
  getRoomMessages,
  postMessage,
  likeMessage
} = require('../controllers/trustCircleController');
const { optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Max 20 messages per hour.' }
});

router.get('/rooms', getRooms);
router.get('/rooms/:room', getRoomMessages);
router.post('/rooms/:room', optionalAuth, messageLimiter, validateMessage, postMessage);
router.post('/messages/:messageId/like', optionalAuth, likeMessage);

module.exports = router;