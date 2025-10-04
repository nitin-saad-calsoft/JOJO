const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Background = require('../models/Background');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/backgrounds');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with proper extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `background-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type - allow images and SVG
    if (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (including SVG) are allowed!'), false);
    }
  }
});

// Get all backgrounds - PUBLIC with proper headers
router.get('/', async (req, res) => {
  try {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const {
      page = 1,
      limit = 20,
      category,
      type,
      search
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const backgrounds = await Background.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Background.countDocuments(query);

    console.log(`📊 Found ${backgrounds.length} backgrounds`);
    backgrounds.forEach(bg => {
      console.log(`🖼️ Background: ${bg.name} | Type: ${bg.type} | File: ${bg.filename || 'none'}`);
    });

    res.json({
      backgrounds,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Error fetching backgrounds:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image background - REQUIRES AUTH
router.post('/image', adminAuth, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { name, category, tags, description } = req.body;

    const background = new Background({
      name: name || req.file.originalname,
      type: 'image',
      category: category || 'abstract',
      filename: req.file.filename,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description: description || '',
      uploadedBy: req.user.id,
      isActive: true
    });

    await background.save();
    console.log(`✅ Image background created: ${background.name} | File: ${background.filename}`);

    res.status(201).json({
      message: 'Background image uploaded successfully',
      background
    });
  } catch (error) {
    console.error('❌ Error uploading background image:', error);
    
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Create color background - REQUIRES AUTH
router.post('/color', adminAuth, async (req, res) => {
  try {
    const { name, category, tags, description, colorData } = req.body;

    const background = new Background({
      name,
      type: colorData.secondary ? 'gradient' : 'color',
      category: category || 'solid',
      colorData,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      description: description || '',
      uploadedBy: req.user.id,
      isActive: true
    });

    await background.save();
    console.log(`✅ Color background created: ${background.name} | Colors: ${colorData.primary}`);

    res.status(201).json({
      message: 'Color background created successfully',
      background
    });
  } catch (error) {
    console.error('❌ Error creating color background:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single background - PUBLIC (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const background = await Background.findById(req.params.id)
      .populate('uploadedBy', 'name');
    
    if (!background) {
      return res.status(404).json({ error: 'Background not found' });
    }

    res.json(background);
  } catch (error) {
    res.status(500).json({ error: error.message });
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