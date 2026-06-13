const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      default: null,
      maxlength: 1000
    },
    audioUrl: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: ['text', 'audio'],
      default: 'text'
    }
  },
  {
    timestamps: true
  }
);

const studyGroupSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    topic: {
      type: String,
      required: true,
      maxlength: 200
    },
    location: {
      type: String,
      required: true,
      maxlength: 200
    },
    dateTime: {
      type: Date,
      required: true
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      max: 20
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    messages: [messageSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

studyGroupSchema.index({ course: 1, dateTime: 1 });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);