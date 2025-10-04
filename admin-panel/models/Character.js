const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['rive', 'static', 'sprite'],
    required: true
  },
  category: {
    type: String,
    enum: ['fantasy', 'sci-fi', 'modern', 'cartoon', 'animal'],
    required: true
  },
  // For Rive characters
  riveFile: {
    filename: String,
    originalName: String,
    fileSize: Number
  },
  animations: [{
    name: String,
    description: String,
    previewImage: {
      filename: String,
      originalName: String,
      fileSize: Number,
      mimeType: String
    }
  }],
  stateMachines: [{
    name: String,
    description: String
  }],
  // For static/sprite characters
  previewImage: {
    filename: String,
    originalName: String,
    fileSize: Number,
    mimeType: String
  },
  spriteSheet: {
    filename: String,
    originalName: String,
    fileSize: Number,
    frames: Number,
    frameWidth: Number,
    frameHeight: Number
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  properties: {
    defaultScale: {
      type: Number,
      default: 1
    },
    defaultRotation: {
      type: Number,
      default: 0
    },
    boundingBox: {
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true
});

// Index for search
characterSchema.index({ name: 'text', tags: 'text', description: 'text' });

module.exports = mongoose.model('Character', characterSchema);