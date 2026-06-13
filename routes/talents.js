const express = require('express');
const router = express.Router();
const {
  createTalent,
  getAllTalents,
  getTalentById,
  likeTalent,
  contactTalent,
  getMyMessages,
  deleteTalent
} = require('../controllers/talentController');
const { protect } = require('../middleware/auth');

// Publique
router.get('/', getAllTalents);
router.get('/:id', getTalentById);

// Protege
router.post('/', protect, createTalent);
router.post('/:id/like', protect, likeTalent);
router.post('/:id/contact', protect, contactTalent);
router.get('/messages/my', protect, getMyMessages);
router.delete('/:id', protect, deleteTalent);

module.exports = router;