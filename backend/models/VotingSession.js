const mongoose = require('mongoose');

const votingSessionSchema = new mongoose.Schema({
  hostAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  candidates: [String],
  voters: [String],
  votes: [{
    voter: String,
    candidate: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  resultDate: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const VotingSession = mongoose.model('VotingSession', votingSessionSchema);

module.exports = VotingSession;