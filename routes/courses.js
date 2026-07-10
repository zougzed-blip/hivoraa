const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const createCourseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many courses created. Try again later.' }
});

const validateCreate = [
  body('code').trim().isLength({ min: 2, max: 20 }).escape(),
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('school').trim().isLength({ min: 2, max: 100 }).escape(),
  body('year').isInt({ min: 1, max: 8 }).withMessage('Year must be between 1 and 8.'),
  body('semester').trim().isLength({ min: 1, max: 5 }).escape()
];

router.get('/', async (req, res, next) => {
  try {
    const { school, year, semester } = req.query;
    const filter = {};
    if (school) filter.school = school;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = semester;

    const courses = await Course.find(filter).sort({ code: 1 });
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, createCourseLimiter, validateCreate, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { code, name, school, year, semester } = req.body;

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Course code already exists.' });
    }

    const course = await Course.create({
      code: code.toUpperCase(),
      name,
      school,
      year,
      semester
    });

    res.status(201).json({ success: true, message: 'Course created.', data: course });
  } catch (error) {
    next(error);
  }
});

module.exports = router;