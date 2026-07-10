const express = require('express');
const router = express.Router();
const {
  validateCreate,
  validateMessage,
  createTalent,
  getAllTalents,
  getTalentById,
  likeTalent,
  contactTalent,
  getMyMessages,
  getTalentMessages,
  getTalentConversations,
  deleteTalent
} = require('../controllers/talentController');
const { protect } = require('../middleware/auth');

// Publique
router.get('/', getAllTalents);
router.get('/:id', getTalentById);

// Protege
router.post('/', protect, validateCreate, createTalent);
router.post('/:id/like', protect, likeTalent);
router.post('/:id/contact', protect, validateMessage, contactTalent);
router.get('/messages/my', protect, getMyMessages);
router.get('/:id/conversations', protect, getTalentConversations);
router.get('/:id/messages', protect, getTalentMessages);
router.delete('/:id', protect, deleteTalent);

module.exports = router;