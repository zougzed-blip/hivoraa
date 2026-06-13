const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    content: {
      type: String,
      required: true,
      maxlength: 3000
    },
    image: {
      type: String,
      default: null
    },
    isUseful: {
      type: Boolean,
      default: false
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    vote: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    }
  }
);

const helpRequestSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: true,
      maxlength: 3000
    },
    deadline: {
      type: Date,
      required: true
    },
    images: [
      {
        type: String
      }
    ],
    difficultyVotes: [voteSchema],
    replies: [replySchema]
  },
  {
    timestamps: true
  }
);

helpRequestSchema.index({ course: 1, createdAt: -1 });
helpRequestSchema.index({ deadline: 1 });
helpRequestSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);