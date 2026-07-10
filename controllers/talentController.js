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
  body('contactPreference').optional().isIn(['internal', 'whatsapp', 'email']),
  body('contactInfo').optional().trim().isLength({ max: 200 }).escape()
];

const validateMessage = [
  body('text').trim().isLength({ min: 1, max: 2000 }).escape(),
  body('receiverId').optional().isMongoId().withMessage('Invalid receiverId.')
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

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { skillOffered: regex },
        { description: regex },
        { skillWanted: regex }
      ];
    }

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

    const { text, receiverId } = req.body;
    const talent = await Talent.findById(req.params.id).populate('user', 'email pseudonym');

    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }

    const isOwner = talent.user._id.toString() === req.user._id.toString();

    
    let finalReceiverId;
    if (isOwner) {
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: 'receiverId is required when replying as the talent owner.'
        });
      }
      finalReceiverId = receiverId;
    } else {
      finalReceiverId = talent.user._id;
    }

  

    const message = await Message.create({
      sender: req.user._id,
      receiver: finalReceiverId,
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

    // Room déterministe par conversation
    
    const participantIds = [req.user._id.toString(), finalReceiverId.toString()].sort();
    const conversationRoom = `talent-${talent._id}-conv-${participantIds[0]}-${participantIds[1]}`;

    const io = getIO();
    io.to(conversationRoom).emit('newMessage', messageData);

    // Email au propriétaire (seulement quand ce n'est pas lui qui écrit)
    if (!isOwner && talent.user.email) {
      const totalMessages = await Message.countDocuments({ talent: talent._id, receiver: talent.user._id });
      if (totalMessages === 1) {
        sendEmailNotification(
          talent.user.email,
          'Hivoraa - New message on your talent',
          `<h3>Someone left a message!</h3>
           <p><b>${req.user.pseudonym}</b> is interested in your talent: <b>${talent.skillOffered}</b></p>
           <p>Log in to Hivoraa to reply.</p>`
        );
      }
    }

    res.status(201).json({ success: true, message: 'Message sent.', data: message });
  } catch (error) {
    next(error);
  }
};

const getTalentMessages = async (req, res, next) => {
  try {
    const talent = await Talent.findById(req.params.id);

    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }

    const isOwner = talent.user.toString() === req.user._id.toString();
    const { with: otherUserId } = req.query

    let filter = { talent: req.params.id };

    if (isOwner) {
      
      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: 'Specify ?with=<userId> to view a specific conversation.'
        });
      }
      filter.$or = [
        { sender: otherUserId, receiver: req.user._id },
        { sender: req.user._id, receiver: otherUserId }
      ];
    } else {
      // Un non-propriétaire ne voit que SA propre conversation avec le propriétaire
      filter.$or = [
        { sender: req.user._id },
        { receiver: req.user._id }
      ];
    }

    const messages = await Message.find(filter)
      .populate('sender', 'pseudonym')
      .populate('talent', 'skillOffered')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

// Liste des conversations distinctes pour un talent 
const getTalentConversations = async (req, res, next) => {
  try {
    const talent = await Talent.findById(req.params.id);

    if (!talent) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }

    if (talent.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can view conversations.' });
    }

    const messages = await Message.find({ talent: req.params.id })
      .populate('sender', 'pseudonym')
      .populate('receiver', 'pseudonym')
      .sort({ createdAt: -1 });

    // Regroupe par interlocuteur (celui qui n'est pas le propriétaire)
    const conversationsMap = new Map();
    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === req.user._id.toString()
        ? msg.receiver
        : msg.sender;

      const key = otherUser._id.toString();
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: { _id: otherUser._id, pseudonym: otherUser.pseudonym },
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt
        });
      }
    }

    res.status(200).json({
      success: true,
      data: Array.from(conversationsMap.values())
    });
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
  getTalentMessages,
  getTalentConversations, 
  deleteTalent
};