const TrustMessage = require('../models/TrustMessage');
const { body, validationResult } = require('express-validator');

const rooms = [
  { id: 'stress', name: 'Managing Exam Stress', description: 'Share tips on how to stay calm and focused during exams.' },
  { id: 'loneliness', name: 'Feeling Lonely', description: 'Connect with others who understand what you are going through.' },
  { id: 'family', name: 'Family Pressure', description: 'Talk about family expectations and how to cope with them.' },
  { id: 'money', name: 'Money Struggles', description: 'Discuss financial challenges and share budgeting advice.' },
  { id: 'sleep', name: 'Sleep Issues', description: 'Struggling to sleep? Share your experience and find support.' },
  { id: 'relationships', name: 'Love & Studies', description: 'Balancing your love life with your academic goals.' }
];

// Validation
const validateMessage = [
  body('content').trim().isLength({ min: 1, max: 3000 }).escape(),
  body('temporaryPseudonym').optional().trim().isLength({ min: 2, max: 30 }).escape()
];

// List all rooms
const getRooms = (req, res) => {
  res.status(200).json({ success: true, data: rooms });
};

// Get messages from a room
const getRoomMessages = async (req, res, next) => {
  try {
    const { room } = req.params;

    if (!rooms.find(r => r.id === room)) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await TrustMessage.find({ room })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TrustMessage.countDocuments({ room });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Post a message in a room
const postMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { room } = req.params;
    const { content, temporaryPseudonym } = req.body;

    if (!rooms.find(r => r.id === room)) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const message = await TrustMessage.create({
      room,
      author: req.user ? req.user._id : null,
      temporaryPseudonym: temporaryPseudonym || 'Anonymous',
      content
    });

    res.status(201).json({ success: true, message: 'Message posted.', data: message });
  } catch (error) {
    next(error);
  }
};

// Like a message
const likeMessage = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Login required to like.' });
    }

    const message = await TrustMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const alreadyLiked = message.likes.some(
      id => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      message.likes = message.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      message.likes.push(req.user._id);
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed.' : 'Like added.',
      data: { likesCount: message.likes.length, isLiked: !alreadyLiked }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateMessage,
  getRooms,
  getRoomMessages,
  postMessage,
  likeMessage
};