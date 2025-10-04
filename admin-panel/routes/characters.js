const express = require('express');
const Character = require('../models/Character');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/characters/' });
const path = require('path');

const router = express.Router();

// Get all characters - PUBLIC (no auth required)
router.get('/', async (req, res) => {
  try {
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

    const characters = await Character.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Attach previewImage from animationPreviews if missing in animations
    const charactersWithPreviews = characters.map(character => {
      const obj = character.toObject();
      if (Array.isArray(obj.animations)) {
        obj.animations = obj.animations.map(anim => {
          if (!anim.previewImage && Array.isArray(obj.animationPreviews)) {
            const found = obj.animationPreviews.find(
              p => p.animationName === anim.name
            );
            if (found) {
              anim.previewImage = {
                filename: found.filename,
                originalName: found.originalName,
                fileSize: found.fileSize,
                mimeType: found.mimeType
              };
            }
          }
          return anim;
        });
      }
      return obj;
    });

    const total = await Character.countDocuments(query);

    res.json({
      characters: charactersWithPreviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single character - PUBLIC (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('uploadedBy', 'name');
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const responseCharacter = character.toObject();

    if (Array.isArray(responseCharacter.animations)) {
      responseCharacter.animations = responseCharacter.animations.map(anim => {
        if (!anim.previewImage && Array.isArray(responseCharacter.animationPreviews)) {
          const found = responseCharacter.animationPreviews.find(
            p => p.animationName === anim.name
          );
          if (found) {
            anim.previewImage = {
              filename: found.filename,
              originalName: found.originalName,
              fileSize: found.fileSize,
              mimeType: found.mimeType
            };
          }
        }
        return anim;
      });
    }

    res.json(responseCharacter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a GET endpoint to fetch a single character by id with full animation data
router.get('/full/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    // Attach previewImage from animationPreviews if missing in animations
    const obj = character.toObject();
    if (Array.isArray(obj.animations)) {
      obj.animations = obj.animations.map(anim => {
        if (!anim.previewImage && Array.isArray(obj.animationPreviews)) {
          const found = obj.animationPreviews.find(
            p => p.animationName === anim.name
          );
          if (found) {
            anim.previewImage = {
              filename: found.filename,
              originalName: found.originalName,
              fileSize: found.fileSize,
              mimeType: found.mimeType
            };
          }
        }
        return anim;
      });
    }
    res.json(obj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create character with animation preview images
router.post(
  '/',
  adminAuth,
  upload.fields([
    { name: 'rive', maxCount: 1 },
    { name: 'preview', maxCount: 1 },
    { name: 'animationPreviews', maxCount: 20 }
  ]),
  async (req, res) => {
    try {
      const { name, category, tags, description, animations, stateMachines } = req.body;
      let parsedAnimations = [];
      if (animations) {
        parsedAnimations = JSON.parse(animations);
      }

      // Attach preview images to each animation object
      if (req.files.animationPreviews && Array.isArray(parsedAnimations)) {
        req.files.animationPreviews.forEach((file, idx) => {
          if (parsedAnimations[idx]) {
            parsedAnimations[idx].previewImage = {
              filename: file.filename,
              originalName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype
            };
          }
        });
      }

      // Always set animationPreviews property for legacy/frontend compatibility
      let animationPreviews = [];
      // if (req.files.animationPreviews && Array.isArray(parsedAnimations)) {
      //   animationPreviews = req.files.animationPreviews.map((file, idx) => ({
      //     filename: file.filename,
      //     originalName: file.originalname,
      //     fileSize: file.size,
      //     mimeType: file.mimetype,
      //     animationName: (parsedAnimations[idx] && parsedAnimations[idx].name) || null
      //   }));
      // }
  console.log("---parsedAnimations", parsedAnimations)
      const character = new Character({
        name,
        type: 'rive',
        category: category || 'cartoon',
        riveFile: req.files.rive ? {
          filename: req.files.rive[0].filename,
          originalName: req.files.rive[0].originalname,
          fileSize: req.files.rive[0].size
        } : undefined,
        animations: parsedAnimations,
        animationPreviews, // <-- Ensure this property is set
        stateMachines: stateMachines ? JSON.parse(stateMachines) : [],
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        description,
        uploadedBy: req.user._id
      });
      console.log('Character to be saved:*(*(*(*(**', character);
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
  }
);

// PUT: Update character and animation preview images
router.put('/:id', adminAuth, upload.fields([
  { name: 'animationPreviews', maxCount: 20 }
]), async (req, res) => {
  try {
    const { name, category, tags, description, isActive, animations, stateMachines } = req.body;
    let updateData = {
      name,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      description,
      isActive
    };

    let parsedAnimations = [];
    if (animations) {
      parsedAnimations = JSON.parse(animations);

      // Attach preview images to each animation object (if new files uploaded)
      if (req.files && req.files.animationPreviews && Array.isArray(parsedAnimations)) {
        req.files.animationPreviews.forEach((file, idx) => {
          // Always update previewImage for the animation at idx if a new file is uploaded
          if (parsedAnimations[idx]) {
            parsedAnimations[idx].previewImage = {
              filename: file.filename,
              originalName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype
            };
          }
        });
      }

      // If no new file is uploaded for an animation, preserve the old previewImage from DB
      const characterInDb = await Character.findById(req.params.id);
      if (characterInDb && Array.isArray(characterInDb.animations)) {
        parsedAnimations = parsedAnimations.map((anim, idx) => {
          if (!anim.previewImage && characterInDb.animations[idx]?.previewImage) {
            anim.previewImage = characterInDb.animations[idx].previewImage;
          }
          return anim;
        });
      }

      updateData.animations = parsedAnimations;
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

// Delete character - REQUIRES AUTH
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

// Serve character files (Rive and images) with CORS and ORB headers
router.get('/uploads/characters/:filename', (req, res) => {
  // Use absolute path for local file, not a URL
  const filePath = path.join(__dirname, '..', 'uploads', 'characters', req.params.filename);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

module.exports = router;