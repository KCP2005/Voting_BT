const mongoose = require('mongoose');

// Add these fields to your existing VotingSession model
const VotingSessionSchema = new mongoose.Schema({
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
  },
  // Add these new fields
  blockchainId: {
    type: String,
    default: null
  },
  blockchainTxHash: {
    type: String,
    default: null
  }
});

// Add txHash field to the Vote schema in your VotingSession model

const VoteSchema = new mongoose.Schema({
  voter: {
    type: String,
    required: true
  },
  candidate: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  txHash: {
    type: String,
    default: null
  }
});

const VotingSession = mongoose.model('VotingSession', votingSessionSchema);

module.exports = VotingSession;