const StudyGroup = require('../models/StudyGroup');
const Course = require('../models/Course');
const cloudinary = require('../config/cloudinary');
const { getIO } = require('../config/socket');
const { body, validationResult } = require('express-validator');

// Upload Cloudinary (image ou audio)
const uploadToCloudinary = (file, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `hivoraa/${folder}`, resource_type: resourceType },
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
  body('course').trim().isLength({ min: 1, max: 30 }).escape().withMessage('Course is required.'),
  body('topic').trim().isLength({ min: 3, max: 200 }).escape(),
  body('location').trim().isLength({ min: 2, max: 200 }).escape(),
  body('dateTime').isISO8601().withMessage('Invalid date.'),
  body('maxParticipants').isInt({ min: 2, max: 20 }).withMessage('Must be 2-20.')
];

// Validation rules for sending a message
const validateSendMessage = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters.')
    .escape()
];

// Create study group
const createStudyGroup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { course, topic, location, dateTime, maxParticipants } = req.body;

    // Trouver ou créer le cours
    let finalCourseId = course;

    if (course.match(/^[0-9a-fA-F]{24}$/)) {
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({ success: false, message: 'Course not found.' });
      }
    } else {
      let courseDoc = await Course.findOne({ code: course.toUpperCase() });
      if (!courseDoc) {
        courseDoc = await Course.create({
          code: course.toUpperCase(),
          name: course.toUpperCase(),
          school: 'User Added',
          year: 1,
          semester: 'A'
        });
      }
      finalCourseId = courseDoc._id;
    }

    const studyGroup = await StudyGroup.create({
      creator: req.user._id,
      course: finalCourseId,
      topic,
      location,
      dateTime,
      maxParticipants,
      participants: [req.user._id]
    });

    await studyGroup.populate('creator', 'pseudonym');
    await studyGroup.populate('course', 'code name year semester');

    res.status(201).json({ success: true, message: 'Group created.', data: studyGroup });
  } catch (error) {
    next(error);
  }
};

// Get all groups
const getAllStudyGroups = async (req, res, next) => {
  try {
    const { course, active, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (course) filter.course = course;
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const studyGroups = await StudyGroup.find(filter)
      .populate('creator', 'pseudonym')
      .populate('course', 'code name year semester')
      .populate('participants', 'pseudonym')
      .populate('messages.sender', 'pseudonym')
      .sort({ dateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyGroup.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: studyGroups.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: studyGroups
    });
  } catch (error) {
    next(error);
  }
};

// Get group by ID
const getStudyGroupById = async (req, res, next) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id)
      .populate('creator', 'pseudonym')
      .populate('course', 'code name year semester')
      .populate('participants', 'pseudonym')
      .populate('messages.sender', 'pseudonym');

    if (!studyGroup) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    res.status(200).json({ success: true, data: studyGroup });
  } catch (error) {
    next(error);
  }
};

// Join group
const joinStudyGroup = async (req, res, next) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (!studyGroup.isActive) {
      return res.status(400).json({ success: false, message: 'Group is closed.' });
    }

    const alreadyParticipant = studyGroup.participants.some(
      id => id.toString() === req.user._id.toString()
    );

    if (alreadyParticipant) {
      return res.status(400).json({ success: false, message: 'Already joined.' });
    }

    if (studyGroup.participants.length >= studyGroup.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Group is full.' });
    }

    studyGroup.participants.push(req.user._id);
    await studyGroup.save();
    await studyGroup.populate('participants', 'pseudonym');

    res.status(200).json({
      success: true,
      message: 'Joined group.',
      data: {
        participantsCount: studyGroup.participants.length,
        maxParticipants: studyGroup.maxParticipants,
        isFull: studyGroup.participants.length >= studyGroup.maxParticipants
      }
    });
  } catch (error) {
    next(error);
  }
};

// Leave group
const leaveStudyGroup = async (req, res, next) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    studyGroup.participants = studyGroup.participants.filter(
      id => id.toString() !== req.user._id.toString()
    );

    if (studyGroup.participants.length === 0) {
      studyGroup.isActive = false;
    }

    await studyGroup.save();

    res.status(200).json({ success: true, message: 'Left group.' });
  } catch (error) {
    next(error);
  }
};

// Send text message 
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { text } = req.body;

    if (!text || text.length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isParticipant = studyGroup.participants.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Join group first.' });
    }

    studyGroup.messages.push({
      sender: req.user._id,
      text: text,
      type: 'text'
    });

    await studyGroup.save();

    const savedMessage = studyGroup.messages[studyGroup.messages.length - 1];
    await studyGroup.populate('messages.sender', 'pseudonym');

    const messageData = {
      _id: savedMessage._id,
      sender: { _id: req.user._id, pseudonym: req.user.pseudonym },
      text: text,
      type: 'text',
      createdAt: savedMessage.createdAt
    };

    // Real-time emission
    const io = getIO();
    io.to(`group-${req.params.id}`).emit('newMessage', messageData);

    res.status(201).json({ success: true, message: 'Message sent.', data: messageData });
  } catch (error) {
    next(error);
  }
};

// Send audio message (real-time)
const sendAudioMessage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file required.' });
    }

    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isParticipant = studyGroup.participants.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Join group first.' });
    }

    // Upload audio to Cloudinary
    const audioUrl = await uploadToCloudinary(req.file, 'audio', 'video');

    studyGroup.messages.push({
      sender: req.user._id,
      audioUrl: audioUrl,
      type: 'audio'
    });

    await studyGroup.save();

    const savedMessage = studyGroup.messages[studyGroup.messages.length - 1];
    await studyGroup.populate('messages.sender', 'pseudonym');

    const messageData = {
      _id: savedMessage._id,
      sender: { _id: req.user._id, pseudonym: req.user.pseudonym },
      audioUrl: audioUrl,
      type: 'audio',
      createdAt: savedMessage.createdAt
    };

    // Real-time emission
    const io = getIO();
    io.to(`group-${req.params.id}`).emit('newMessage', messageData);

    res.status(201).json({ success: true, message: 'Audio sent.', data: messageData });
  } catch (error) {
    next(error);
  }
};

// Delete group 
const deleteStudyGroup = async (req, res, next) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (studyGroup.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only creator can delete.' });
    }

    await studyGroup.deleteOne();

    res.status(200).json({ success: true, message: 'Group deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreate,
  validateSendMessage,
  createStudyGroup,
  getAllStudyGroups,
  getStudyGroupById,
  joinStudyGroup,
  leaveStudyGroup,
  sendMessage,
  sendAudioMessage,
  deleteStudyGroup
};