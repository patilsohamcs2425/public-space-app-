const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  friends: [mongoose.Schema.Types.ObjectId]
});
module.exports = mongoose.model('User', userSchema);