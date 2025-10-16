const express = require('express');
const Movie = require('../models/Movie');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Save or update a draft movie (auto-save)
router.post('/autosave', auth, async (req, res) => {
    console.log("************")
  try {
    const { movieId, data, title } = req.body;
    let movie;
    if (movieId) {
      movie = await Movie.findByIdAndUpdate(
        movieId,
        { data, title, status: 'draft' },
        { new: true, runValidators: true }
      );
    } else {
      movie = new Movie({
        user: req.user._id,
        title: title || 'Draft Movie',
        status: 'draft',
        data,
      });
      await movie.save();
    }
    res.json({ movie });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all my draft movies
router.get('/my-drafts', auth, async (req, res) => {
  try {
    const movies = await Movie.find({ user: req.user._id, status: 'draft' })
      .sort({ updatedAt: -1 });
    res.json({ movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a draft movie by ID (PUT /api/movies/:id)
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, title } = req.body;
    const movie = await Movie.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'draft' },
      { data, title, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!movie) {
      return res.status(404).json({ error: 'Draft movie not found or not owned by user' });
    }
    res.json({ movie });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
