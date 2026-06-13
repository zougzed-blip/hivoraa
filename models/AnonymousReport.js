const mongoose = require('mongoose');

const anonymousReportSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    door: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5]
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    image: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'responded', 'closed'],
      default: 'pending'
    },
    adminResponse: {
      type: String,
      default: null,
      maxlength: 5000
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000)
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AnonymousReport', anonymousReportSchema);