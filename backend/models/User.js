const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;