const express = require('express');
const User = require('../models/User');
const Audio = require('../models/Audio');
const Background = require('../models/Background');
const Character = require('../models/Character');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAudio,
      totalBackgrounds,
      totalCharacters,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Audio.countDocuments({ isActive: true }),
      Background.countDocuments({ isActive: true }),
      Character.countDocuments({ isActive: true }),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password')
    ]);

    // Get usage statistics
    const audioByCategory = await Audio.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const backgroundsByCategory = await Background.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const charactersByCategory = await Character.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const charactersByType = await Character.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get recent activity
    const recentAudio = await Audio.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name');

    const recentBackgrounds = await Background.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name');

    const recentCharacters = await Character.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name');

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalAudio,
        totalBackgrounds,
        totalCharacters
      },
      categories: {
        audio: audioByCategory,
        backgrounds: backgroundsByCategory,
        characters: charactersByCategory
      },
      characterTypes: charactersByType,
      recent: {
        users: recentUsers,
        audio: recentAudio,
        backgrounds: recentBackgrounds,
        characters: recentCharacters
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system health
router.get('/health', auth, async (req, res) => {
  try {
    const dbStatus = await User.findOne().select('_id');
    
    res.json({
      status: 'healthy',
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;