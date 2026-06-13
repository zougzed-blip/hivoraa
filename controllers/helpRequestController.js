const HelpRequest = require('../models/HelpRequest');
const Course = require('../models/Course');
const cloudinary = require('../config/cloudinary');
const { body, validationResult } = require('express-validator');

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `hivoraa/${folder}` },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
};

// Validation rules
const validateCreate = [
  body('course').isMongoId().withMessage('Invalid course ID.'),
  body('title').trim().isLength({ min: 3, max: 150 }).escape(),
  body('content').trim().isLength({ min: 5, max: 3000 }).escape(),
  body('deadline').isISO8601().withMessage('Invalid date format.'),
  body('isAnonymous').optional().isBoolean()
];

const validateVote = [
  body('vote').isIn(['easy', 'medium', 'hard']).withMessage('Vote must be easy, medium or hard.')
];

const validateReply = [
  body('content').trim().isLength({ min: 1, max: 3000 }).escape(),
  body('isAnonymous').optional().isBoolean()
];

// Create help request
const createHelpRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { course, title, content, deadline, isAnonymous } = req.body;

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file, 'help-requests');
        images.push(url);
      }
    }

    const helpRequest = await HelpRequest.create({
      author: req.user ? req.user._id : null,
      isAnonymous: isAnonymous || false,
      course,
      title,
      content,
      deadline,
      images
    });

    await helpRequest.populate('author', 'pseudonym');
    await helpRequest.populate('course', 'code name year semester school');

    res.status(201).json({
      success: true,
      message: 'Help request created.',
      data: helpRequest
    });
  } catch (error) {
    next(error);
  }
};

// Get all help requests
const getAllHelpRequests = async (req, res, next) => {
  try {
    const { course, sort, search, year, semester, limit = 50, page = 1 } = req.query;

    let filter = {};

    if (course) filter.course = course;

    if (year || semester) {
      const courseFilter = {};
      if (year) courseFilter.year = parseInt(year);
      if (semester) courseFilter.semester = semester;
      const courses = await Course.find(courseFilter).select('_id');
      filter.course = { $in: courses.map(c => c._id) };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'deadline') sortOption = { deadline: 1 };
    if (sort === 'active') sortOption = { replies: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const helpRequests = await HelpRequest.find(filter)
      .populate('author', 'pseudonym')
      .populate('course', 'code name year semester school')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: helpRequests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: helpRequests
    });
  } catch (error) {
    next(error);
  }
};

// Get help request by ID
const getHelpRequestById = async (req, res, next) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate('author', 'pseudonym')
      .populate('course', 'code name year semester school')
      .populate('replies.author', 'pseudonym');

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    res.status(200).json({ success: true, data: helpRequest });
  } catch (error) {
    next(error);
  }
};

// Update help request
const updateHelpRequest = async (req, res, next) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    if (helpRequest.author && helpRequest.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const { title, content, deadline } = req.body;

    if (title) helpRequest.title = title;
    if (content) helpRequest.content = content;
    if (deadline) helpRequest.deadline = deadline;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file, 'help-requests');
        helpRequest.images.push(url);
      }
    }

    await helpRequest.save();
    await helpRequest.populate('author', 'pseudonym');
    await helpRequest.populate('course', 'code name year semester school');

    res.status(200).json({
      success: true,
      message: 'Help request updated.',
      data: helpRequest
    });
  } catch (error) {
    next(error);
  }
};

// Delete help request
const deleteHelpRequest = async (req, res, next) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    if (helpRequest.author && helpRequest.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await helpRequest.deleteOne();

    res.status(200).json({ success: true, message: 'Help request deleted.' });
  } catch (error) {
    next(error);
  }
};

// Vote difficulty
const voteDifficulty = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { vote } = req.body;
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    const userId = req.user ? req.user._id : null;

    const existingVote = helpRequest.difficultyVotes.find(v => {
      if (userId) return v.user && v.user.toString() === userId.toString();
      return false;
    });

    if (existingVote) {
      existingVote.vote = vote;
    } else {
      helpRequest.difficultyVotes.push({ user: userId, vote });
    }

    await helpRequest.save();

    const total = helpRequest.difficultyVotes.length;
    const easy = helpRequest.difficultyVotes.filter(v => v.vote === 'easy').length;
    const medium = helpRequest.difficultyVotes.filter(v => v.vote === 'medium').length;
    const hard = helpRequest.difficultyVotes.filter(v => v.vote === 'hard').length;

    res.status(200).json({
      success: true,
      message: 'Vote recorded.',
      data: {
        total,
        easy,
        medium,
        hard,
        easyPercent: total > 0 ? Math.round((easy / total) * 100) : 0,
        mediumPercent: total > 0 ? Math.round((medium / total) * 100) : 0,
        hardPercent: total > 0 ? Math.round((hard / total) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add reply
const addReply = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content, isAnonymous } = req.body;
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    let image = null;
    if (req.file) {
      image = await uploadToCloudinary(req.file, 'replies');
    }

    helpRequest.replies.push({
      author: req.user ? req.user._id : null,
      isAnonymous: isAnonymous || false,
      content,
      image
    });

    await helpRequest.save();

    const newReply = helpRequest.replies[helpRequest.replies.length - 1];

    res.status(201).json({
      success: true,
      message: 'Reply added.',
      data: newReply
    });
  } catch (error) {
    next(error);
  }
};

// Mark reply useful
const markReplyUseful = async (req, res, next) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    const reply = helpRequest.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found.' });
    }

    reply.isUseful = !reply.isUseful;
    await helpRequest.save();

    res.status(200).json({
      success: true,
      message: reply.isUseful ? 'Reply marked useful.' : 'Useful mark removed.',
      data: reply
    });
  } catch (error) {
    next(error);
  }
};

// Like reply
const likeReply = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Login required.' });
    }

    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    const reply = helpRequest.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found.' });
    }

    const alreadyLiked = reply.likes.some(id => id.toString() === req.user._id.toString());

    if (alreadyLiked) {
      reply.likes = reply.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      reply.likes.push(req.user._id);
    }

    await helpRequest.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed.' : 'Like added.',
      data: { likesCount: reply.likes.length, isLiked: !alreadyLiked }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreate,
  validateVote,
  validateReply,
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
  voteDifficulty,
  addReply,
  markReplyUseful,
  likeReply
};