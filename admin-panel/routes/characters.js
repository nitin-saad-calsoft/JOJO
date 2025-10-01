const express = require('express');
const Character = require('../models/Character');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all characters
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, search } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$text = { $search: search };
    }

    const characters = await Character.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Character.countDocuments(query);

    res.json({
      characters,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single character
router.get('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Rive character
router.post('/rive', adminAuth, upload.fields([
  { name: 'rive', maxCount: 1 },
  { name: 'preview', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.rive) {
      return res.status(400).json({ error: 'Rive file is required' });
    }

    const { name, category, tags, description, animations, stateMachines } = req.body;

    const character = new Character({
      name,
      type: 'rive',
      category: category || 'cartoon',
      riveFile: {
        filename: req.files.rive[0].filename,
        originalName: req.files.rive[0].originalname,
        fileSize: req.files.rive[0].size
      },
      animations: animations ? JSON.parse(animations) : [],
      stateMachines: stateMachines ? JSON.parse(stateMachines) : [],
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description,
      uploadedBy: req.user._id
    });

    if (req.files.preview) {
      character.previewImage = {
        filename: req.files.preview[0].filename,
        originalName: req.files.preview[0].originalname,
        fileSize: req.files.preview[0].size,
        mimeType: req.files.preview[0].mimetype
      };
    }

    await character.save();
    await character.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Rive character created successfully',
      character
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create static character
router.post('/static', adminAuth, upload.single('preview'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Preview image is required' });
    }

    const { name, category, tags, description } = req.body;

    const character = new Character({
      name,
      type: 'static',
      category: category || 'cartoon',
      previewImage: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description,
      uploadedBy: req.user._id
    });

    await character.save();
    await character.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Static character created successfully',
      character
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update character
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, category, tags, description, isActive, animations, stateMachines } = req.body;

    const updateData = {
      name,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      description,
      isActive
    };

    if (animations) {
      updateData.animations = JSON.parse(animations);
    }

    if (stateMachines) {
      updateData.stateMachines = JSON.parse(stateMachines);
    }

    const character = await Character.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({
      message: 'Character updated successfully',
      character
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete character
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;