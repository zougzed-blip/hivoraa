const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true, 
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    school: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      enum: [1, 2, 3]
    },
    semester: {
      type: String,
      required: true,
      enum: ['A', 'B']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Course', courseSchema);