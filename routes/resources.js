const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const verifyFileSignature = require('../middleware/verifyFileSignature');
const {
  validateCreate,
  createResource,
  getAllResources,
  getResourceById,
  likeResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const resourceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Max 10 resources per hour.' }
});

// Public
router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Protected
router.post(
  '/',
  protect,
  resourceLimiter,
  upload.single('file'),
  verifyFileSignature(['image', 'pdf']),
  validateCreate,
  createResource
);
router.post('/:id/like', protect, likeResource);
router.delete('/:id', protect, deleteResource);

module.exports = router;