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
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Max 5 reports per hour.' }
});

// Fully public
router.get('/doors', getDoors);
router.post('/submit', reportLimiter, validateReport, submitReport);
router.get('/check/:code', checkReport);

// Admin only
router.get('/stats', protect, getStats);
router.put('/respond/:code', protect, validateResponse, respondToReport);

module.exports = router;