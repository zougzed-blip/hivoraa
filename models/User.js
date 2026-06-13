const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    pseudonym: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    role: {
      type: String,
      enum: ['student', 'moderator', 'admin'],
      default: 'student'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);