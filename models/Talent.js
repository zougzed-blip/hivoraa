const mongoose = require('mongoose');

const talentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    skillOffered: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    skillWanted: {
      type: String,
      required: true,
      maxlength: 200
    },
    contactPreference: {
      type: String,
      enum: ['internal', 'whatsapp', 'email'],
      default: 'internal'
    },
    contactInfo: {
      type: String,
      default: null
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

talentSchema.index({ skillOffered: 'text', skillWanted: 'text', description: 'text' });

module.exports = mongoose.model('Talent', talentSchema);