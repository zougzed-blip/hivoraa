const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');


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


router.post('/', protect, async (req, res, next) => {
  try {
    const { code, name, school, year, semester } = req.body;

    if (!code || !name || !school || !year || !semester) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

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