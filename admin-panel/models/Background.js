const mongoose = require('mongoose');

const backgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['image', 'color', 'gradient'],
    required: true
  },
  // For image backgrounds
  filename: {
    type: String
  },
  originalName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  dimensions: {
    width: Number,
    height: Number
  },
  // For color/gradient backgrounds
  colorData: {
    primary: String,
    secondary: String,
    direction: String // for gradients
  },
  category: {
    type: String,
    enum: ['nature', 'urban', 'fantasy', 'space', 'abstract', 'solid'],
    required: true
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
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
backgroundSchema.index({ name: 'text', tags: 'text', description: 'text' });

module.exports = mongoose.model('Background', backgroundSchema);