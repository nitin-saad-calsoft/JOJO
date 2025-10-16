const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  data: { type: Object, required: true }, // Contains all movie creation data
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure updatedAt is set on every save/update
MovieSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
MovieSchema.pre('findOneAndUpdate', function (next) {
  this._update.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Movie', MovieSchema);
