const Talent = require('../models/Talent');
const Message = require('../models/Message');
const { getIO } = require('../config/socket');
const sendEmailNotification = require('../config/brevo');
const { body, validationResult } = require('express-validator');

// Validation
const validateCreate = [
  body('skillOffered').trim().isLength({ min: 3, max: 200 }).escape(),
  body('description').trim().isLength({ min: 10, max: 1000 }).escape(),
  body('skillWanted').trim().isLength({ min: 3, max: 200 }).escape(),
  body('contactPreference').optional().isIn(['internal', 'whatsapp', 'email'])
];

const validateMessage = [
  body('text').trim().isLength({ min: 1, max: 2000 }).escape()
];

// Create talent
const createTalent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { skillOffered, description, skillWanted, contactPreference, contactInfo } = req.body;

    const talent = await Talent.create({
      user: req.user._id,
      skillOffered,
      description,
      skillWanted,
      contactPreference: contactPreference || 'internal',
      contactInfo: contactInfo || null
    });

    await talent.populate('user', 'pseudonym');
    res.status(201).json({ success: true, message: 'Talent posted.', data: talent });
  } catch (error) {
    next(error);
  }
};

// Get all talents
const getAllTalents = async (req, res, next) => {
  try {
    const { search, sort } = req.query;
    const filter = {};
    if (search) filter.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likes: -1 };

    const talents = await Talent.find(filter)
      .populate('user', 'pseudonym')
      .sort(sortOption)
      .limit(50);

    res.status(200).json({ success: true, count: talents.length, data: talents });
  } catch (error) {
    next(error);
  }
};

// Get talent by ID
const getTalentById = async (req, res, next) => {
  try {
    const talent = await Talent.findById(req.params.id).populate('user', 'pseudonym');
    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }
    res.status(200).json({ success: true, data: talent });
  } catch (error) {
    next(error);
  }
};

// Like talent
const likeTalent = async (req, res, next) => {
  try {
    const talent = await Talent.findById(req.params.id);
    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }

    const alreadyLiked = talent.likes.some(id => id.toString() === req.user._id.toString());

    if (alreadyLiked) {
      talent.likes = talent.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      talent.likes.push(req.user._id);
    }

    await talent.save();
    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed.' : 'Like added.',
      data: { likesCount: talent.likes.length, isLiked: !alreadyLiked }
    });
  } catch (error) {
    next(error);
  }
};

const contactTalent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { text } = req.body;
    const talent = await Talent.findById(req.params.id).populate('user', 'email pseudonym');

    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }

    // Determine receiver
    let receiverId;
    const isSelfContact = talent.user._id.toString() === req.user._id.toString();

    if (isSelfContact) {
      // Owner is replying: find the last person who messaged them about this talent
      const lastMessage = await Message.findOne({
        talent: talent._id,
        receiver: req.user._id
      }).sort({ createdAt: -1 });

      receiverId = lastMessage ? lastMessage.sender : req.user._id;
    } else {
      // Someone is contacting the talent owner
      receiverId = talent.user._id;
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      talent: talent._id,
      text
    });

    await message.populate('sender', 'pseudonym');

    const messageData = {
      _id: message._id,
      sender: { _id: req.user._id, pseudonym: req.user.pseudonym },
      text,
      talent: { _id: talent._id, skillOffered: talent.skillOffered },
      createdAt: message.createdAt
    };

    // Emit to BOTH users
    const io = getIO();
    io.to(`user-${receiverId}`).emit('newMessage', messageData);
    io.to(`user-${req.user._id}`).emit('newMessage', messageData);

    // Email on first message only
    const messageCount = await Message.countDocuments({
      sender: req.user._id,
      receiver: receiverId,
      talent: talent._id
    });

    if (messageCount === 1 && !isSelfContact && talent.user.email) {
      sendEmailNotification(
        talent.user.email,
        'Hivoraa - New message',
        `<h3>You have a new message!</h3>
         <p><b>${req.user.pseudonym}</b> is interested in your talent: <b>${talent.skillOffered}</b></p>
         <p>Log in to Hivoraa to reply.</p>`
      );
    }

    res.status(201).json({ success: true, message: 'Message sent.', data: message });
  } catch (error) {
    next(error);
  }
};

// Get my messages (both sent and received)
const getMyMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { receiver: req.user._id },
        { sender: req.user._id }
      ]
    })
      .populate('sender', 'pseudonym')
      .populate('receiver', 'pseudonym')
      .populate('talent', 'skillOffered')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

// Delete talent
const deleteTalent = async (req, res, next) => {
  try {
    const talent = await Talent.findById(req.params.id);
    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }
    if (talent.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await talent.deleteOne();
    res.status(200).json({ success: true, message: 'Talent deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreate,
  validateMessage,
  createTalent,
  getAllTalents,
  getTalentById,
  likeTalent,
  contactTalent,
  getMyMessages,
  deleteTalent
};