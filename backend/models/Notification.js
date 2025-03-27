const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    lowercase: true
  },
  type: {
    type: String,
    required: true,
    enum: ['candidate_nomination', 'voting_result', 'system']
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'actioned'],
    default: 'pending'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;