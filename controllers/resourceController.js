const Resource = require('../models/Resource');
const Course = require('../models/Course');
const cloudinary = require('../config/cloudinary');
const { body, validationResult } = require('express-validator');

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hivoraa/resources' },
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
  body('title').trim().isLength({ min: 3, max: 200 }).escape(),
  body('type').isIn(['pdf', 'video', 'link', 'image']).withMessage('Invalid type.')
];

// Create resource
const createResource = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { course, title, type, link } = req.body;

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    let fileUrl;

    if (req.file) {
      fileUrl = await uploadToCloudinary(req.file);
    } else if (link) {
      fileUrl = link;
    } else {
      return res.status(400).json({ success: false, message: 'File or link required.' });
    }

    const resource = await Resource.create({
      uploader: req.user._id,
      course,
      title,
      type,
      fileUrl
    });

    await resource.populate('uploader', 'pseudonym');
    await resource.populate('course', 'code name year semester');

    res.status(201).json({ success: true, message: 'Resource shared.', data: resource });
  } catch (error) {
    next(error);
  }
};

// Get all resources
const getAllResources = async (req, res, next) => {
  try {
    const { course, type, sort, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (course) filter.course = course;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likes: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const resources = await Resource.find(filter)
      .populate('uploader', 'pseudonym')
      .populate('course', 'code name year semester')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

// Get resource by ID
const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploader', 'pseudonym')
      .populate('course', 'code name year semester');

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

// Like/Unlike resource
const likeResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const alreadyLiked = resource.likes.some(
      id => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      resource.likes = resource.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      resource.likes.push(req.user._id);
    }

    await resource.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed.' : 'Like added.',
      data: { likesCount: resource.likes.length, isLiked: !alreadyLiked }
    });
  } catch (error) {
    next(error);
  }
};

// Delete resource
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    if (resource.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await resource.deleteOne();

    res.status(200).json({ success: true, message: 'Resource deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreate,
  createResource,
  getAllResources,
  getResourceById,
  likeResource,
  deleteResource
};