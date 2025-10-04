const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  duration: {
    type: String, // <-- Change from Number to String
    default: '0:00',
    required: true,
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['background', 'effect', 'voice', 'music'],
    default: 'background'
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  metadata: {
    bitrate: String,
    sampleRate: String,
    channels: String
  }
}, {
  timestamps: true
});

// Index for search
audioSchema.index({ name: 'text', tags: 'text', description: 'text' });

module.exports = mongoose.model('Audio', audioSchema);