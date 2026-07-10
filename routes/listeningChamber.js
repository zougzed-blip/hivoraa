const express = require('express');
const router = express.Router();
const {
  validateReport,
  validateResponse,
  getDoors,
  submitReport,
  checkReport,
  getStats,
  respondToReport
} = require('../controllers/listeningChamberController');
const { protect, hasRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Max 5 reports per hour.' }
});

const checkCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Try again later.' }
});

// Fully public
router.get('/doors', getDoors);
router.post('/submit', reportLimiter, validateReport, submitReport);
router.get('/check/:code', checkCodeLimiter, checkReport);

// Stats globales : admin uniquement
router.get('/stats', protect, hasRole('admin'), getStats);

// Répondre à un signalement : admin + moderator
router.put('/respond/:code', protect, hasRole('admin', 'moderator'), validateResponse, respondToReport);

module.exports = router;