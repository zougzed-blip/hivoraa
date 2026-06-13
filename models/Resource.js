const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    type: {
      type: String,
      required: true,
      enum: ['pdf', 'video', 'link', 'image']
    },
    fileUrl: {
      type: String,
      required: true
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

resourceSchema.index({ course: 1, type: 1 });
resourceSchema.index({ title: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);