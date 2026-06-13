const express = require('express');
const router = express.Router();
const { googleLogin, setPseudonym } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Try again later.' }
});

router.post('/google', authLimiter, googleLogin);
router.put('/pseudonym', protect, setPseudonym);

module.exports = router;