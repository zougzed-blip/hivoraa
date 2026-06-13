const mongoose = require('mongoose');

const trustMessageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      enum: ['stress', 'loneliness', 'family', 'money', 'sleep', 'relationships']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    temporaryPseudonym: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 3000
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

trustMessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('TrustMessage', trustMessageSchema);