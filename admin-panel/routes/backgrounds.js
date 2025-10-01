const express = require('express');
const Background = require('../models/Background');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all backgrounds
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, search } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$text = { $search: search };
    }

    const backgrounds = await Background.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Background.countDocuments(query);

    res.json({
      backgrounds,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single background
router.get('/:id', auth, async (req, res) => {
  try {
    const background = await Background.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!background) {
      return res.status(404).json({ error: 'Background not found' });
    }

    res.json(background);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create background (image upload)
router.post('/image', adminAuth, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No background image provided' });
    }

    const { name, category, tags, description } = req.body;

    const background = new Background({
      name: name || req.file.originalname,
      type: 'image',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: category || 'abstract',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description,
      uploadedBy: req.user._id
    });

    await background.save();
    await background.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Background image uploaded successfully',
      background
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create color/gradient background
router.post('/color', adminAuth, async (req, res) => {
  try {
    const { name, category, tags, description, colorData } = req.body;

    if (!colorData || !colorData.primary) {
      return res.status(400).json({ error: 'Color data is required' });
    }

    const background = new Background({
      name,
      type: colorData.secondary ? 'gradient' : 'color',
      category: category || 'solid',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description,
      colorData,
      uploadedBy: req.user._id
    });

    await background.save();
    await background.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Background created successfully',
      background
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update background
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, category, tags, description, isActive, colorData } = req.body;

    const updateData = {
      name,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      description,
      isActive
    };

    if (colorData) {
      updateData.colorData = colorData;
    }

    const background = await Background.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    if (!background) {
      return res.status(404).json({ error: 'Background not found' });
    }

    res.json({
      message: 'Background updated successfully',
      background
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete background
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const background = await Background.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!background) {
      return res.status(404).json({ error: 'Background not found' });
    }

    res.json({ message: 'Background deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;