const express = require('express');
const Audio = require('../models/Audio');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all audio files
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const audio = await Audio.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Audio.countDocuments(query);

    res.json({
      audio,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single audio file
router.get('/:id', auth, async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!audio) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    res.json(audio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload audio file
router.post('/', adminAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { name, category, tags, description } = req.body;

    const audio = new Audio({
      name: name || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      duration: 0, // You might want to use a library to get actual duration
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: category || 'background',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description,
      uploadedBy: req.user._id
    });

    await audio.save();
    await audio.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Audio file uploaded successfully',
      audio
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update audio file
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, category, tags, description, isActive } = req.body;

    const audio = await Audio.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        description,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    if (!audio) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    res.json({
      message: 'Audio file updated successfully',
      audio
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete audio file
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const audio = await Audio.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!audio) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    res.json({ message: 'Audio file deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;