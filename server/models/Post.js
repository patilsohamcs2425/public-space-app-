const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Post', postSchema);