const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const ethers = require('ethers');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting-dapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Define Voter Schema
const voterSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  registered: {
    type: Boolean,
    default: true
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Voter = mongoose.model('Voter', voterSchema);

// API Routes
app.post('/register', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    // Check if wallet already exists
    const existingVoter = await Voter.findOne({ walletAddress });
    if (existingVoter) {
      return res.status(400).json({ success: false, message: 'Wallet already registered' });
    }
    
    // Create new voter
    const voter = new Voter({ walletAddress });
    await voter.save();
    
    res.status(201).json({ success: true, message: 'Voter registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/check/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const voter = await Voter.findOne({ walletAddress: wallet });
    
    if (voter) {
      res.json({ registered: true, hasVoted: voter.hasVoted });
    } else {
      res.json({ registered: false, hasVoted: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/vote', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    // Update voter status
    await Voter.findOneAndUpdate(
      { walletAddress },
      { hasVoted: true }
    );
    
    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5001; // Changed from 5000 to 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));