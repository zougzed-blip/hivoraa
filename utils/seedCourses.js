const mongoose = require('mongoose');
const Course = require('../models/Course');

const seedCourses = async () => {
  try {
    const coursesCount = await Course.countDocuments();
    if (coursesCount > 0) {
      console.log('Courses already seeded');
      return;
    }

    const courses = [
      {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript',
        instructor: 'Admin',
        level: 'beginner',
      },
      {
        title: 'Advanced JavaScript',
        description: 'Master ES6, async/await, and modern JavaScript',
        instructor: 'Admin',
        level: 'intermediate',
      },
      {
        title: 'Full Stack Development',
        description: 'Build complete applications with frontend and backend',
        instructor: 'Admin',
        level: 'advanced',
      },
    ];

    await Course.insertMany(courses);
    console.log('Courses seeded successfully');
  } catch (error) {
    console.error('Error seeding courses:', error);
  }
};

module.exports = seedCourses;
