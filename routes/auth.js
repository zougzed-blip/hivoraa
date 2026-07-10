const express = require('express');
const router = express.Router();
const { googleLogin, setPseudonym, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many attempts. Try again later.' }
});

router.post('/google', authLimiter, googleLogin);
router.put('/pseudonym', protect, setPseudonym);
router.post('/logout', logout);

module.exports = router;