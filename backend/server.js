const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

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

// Define User Schema
const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ walletAddress: decoded.walletAddress });
    
    if (!user) {
      throw new Error();
    }
    
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// API Routes
// Check if a wallet is registered
app.get('/api/users/check/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await User.findOne({ walletAddress: address.toLowerCase() });
    res.json({ registered: !!user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { walletAddress, username } = req.body;
    
    if (!walletAddress || !username) {
      return res.status(400).json({ success: false, message: 'Wallet address and username are required' });
    }
    
    // Check if wallet is already registered
    const existingWallet = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existingWallet) {
      return res.status(400).json({ success: false, message: 'This wallet is already registered' });
    }
    
    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'This username is already taken' });
    }
    
    // Create new user
    const user = new User({
      walletAddress: walletAddress.toLowerCase(),
      username
    });
    
    await user.save();
    
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/users/verify', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }
    
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not registered' });
    }
    
    // Generate token
    const token = jwt.sign({ walletAddress: user.walletAddress }, JWT_SECRET);
    
    res.json({ 
      success: true, 
      token,
      user: {
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin,
        hasVoted: user.hasVoted
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/users/check/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });
    
    if (user) {
      res.json({ registered: true, hasVoted: user.hasVoted, isAdmin: user.isAdmin });
    } else {
      res.json({ registered: false, hasVoted: false, isAdmin: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Protected route example
app.get('/api/users/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add these routes to your existing server.js file

// Define Voting Session Schema
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

// Create a new voting session
app.post('/api/voting/create', async (req, res) => {
  try {
    const { 
      hostAddress, 
      name, 
      description, 
      candidates, 
      voters,
      startDate,
      endDate,
      resultDate
    } = req.body;
    
    if (!hostAddress || !name || !candidates || !voters || !startDate || !endDate || !resultDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    if (candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one candidate is required' });
    }
    
    if (voters.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one voter is required' });
    }
    
    // Validate dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result = new Date(resultDate);
    
    if (start < now) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }
    
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    
    if (result < end) {
      return res.status(400).json({ success: false, message: 'Result declaration must be after voting ends' });
    }
    
    // Process voters - convert usernames to wallet addresses
    const processedVoters = [];
    
    for (const voter of voters) {
      if (voter.type === 'username') {
        // Look up the wallet address for this username
        const user = await User.findOne({ username: voter.identifier });
        if (user) {
          processedVoters.push(user.walletAddress.toLowerCase());
        }
      } else {
        // It's already a wallet address
        processedVoters.push(voter.identifier.toLowerCase());
      }
    }
    
    // Create new voting session
    const session = new VotingSession({
      hostAddress: hostAddress.toLowerCase(),
      name,
      description,
      candidates,
      voters: processedVoters,
      votes: [],
      startDate,
      endDate,
      resultDate
    });
    
    await session.save();
    
    res.status(201).json({ success: true, message: 'Voting session created successfully', session });
  } catch (error) {
    console.error('Error creating voting session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add an endpoint to get all registered users
app.get('/api/users/all', async (req, res) => {
  try {
    // Only return necessary fields for security
    const users = await User.find({}, 'username walletAddress');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get voting sessions hosted by a user
app.get('/api/voting/host/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const sessions = await VotingSession.find({ hostAddress: address.toLowerCase() });
    
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get voting sessions where a user can vote
app.get('/api/voting/voter/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const sessions = await VotingSession.find({ 
      voters: address.toLowerCase(),
      active: true
    });
    
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cast a vote
app.post('/api/voting/vote', async (req, res) => {
  try {
    const { sessionId, voter, candidate } = req.body;
    
    if (!sessionId || !voter || !candidate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Find the voting session
    const session = await VotingSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    if (!session.active) {
      return res.status(400).json({ success: false, message: 'This voting session is closed' });
    }
    
    // Check if voter is eligible
    if (!session.voters.includes(voter.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'You are not eligible to vote in this session' });
    }
    
    // Check if candidate exists
    if (!session.candidates.includes(candidate)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate' });
    }
    
    // Check if voter has already voted
    const hasVoted = session.votes.some(vote => vote.voter.toLowerCase() === voter.toLowerCase());
    if (hasVoted) {
      return res.status(400).json({ success: false, message: 'You have already voted in this session' });
    }
    
    // Add the vote
    session.votes.push({
      voter: voter.toLowerCase(),
      candidate,
      timestamp: new Date()
    });
    
    await session.save();
    
    res.json({ success: true, message: 'Vote cast successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get results for a voting session
app.get('/api/voting/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await VotingSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    // Calculate results
    const results = session.candidates.map(candidate => {
      const voteCount = session.votes.filter(vote => vote.candidate === candidate).length;
      return {
        candidate,
        votes: voteCount
      };
    });
    
    // Sort by vote count (descending)
    results.sort((a, b) => b.votes - a.votes);
    
    res.json({
      success: true,
      session: {
        name: session.name,
        description: session.description,
        active: session.active,
        totalVotes: session.votes.length,
        totalVoters: session.voters.length
      },
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Close a voting session
app.post('/api/voting/close/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { hostAddress } = req.body;
    
    const session = await VotingSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    // Check if the requester is the host
    if (session.hostAddress.toLowerCase() !== hostAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Only the host can close this voting session' });
    }
    
    session.active = false;
    await session.save();
    
    res.json({ success: true, message: 'Voting session closed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add these new endpoints to your server.js file

// Import the Notification model
const Notification = require('./models/Notification');

// Add a candidate to an existing voting session
app.post('/api/voting/addCandidate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { hostAddress, candidateName, candidateUsername } = req.body;
    
    if (!candidateName || !hostAddress || !candidateUsername) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Find the voting session
    const session = await VotingSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    // Check if the requester is the host
    if (session.hostAddress.toLowerCase() !== hostAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Only the host can modify this voting session' });
    }
    
    // Check if voting is still active
    if (!session.active) {
      return res.status(400).json({ success: false, message: 'Cannot modify a closed voting session' });
    }
    
    // Check if candidate already exists
    if (session.candidates.some(c => c.name === candidateName)) {
      return res.status(400).json({ success: false, message: 'This candidate already exists' });
    }
    
    // Find the user by username
    const user = await User.findOne({ username: candidateUsername });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this username' });
    }
    
    // Add the candidate with pending status
    session.candidates.push({
      name: candidateName,
      status: 'pending',
      username: candidateUsername
    });
    await session.save();
    
    // Create a notification for the candidate
    const notification = new Notification({
      recipient: user.walletAddress.toLowerCase(),
      type: 'candidate_nomination',
      message: `You have been nominated as a candidate for "${session.name}" voting session.`,
      status: 'pending',
      data: {
        sessionId: session._id,
        sessionName: session.name,
        candidateName: candidateName
      }
    });
    await notification.save();
    
    res.json({ 
      success: true, 
      message: 'Candidate nomination sent',
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get notifications for a user
app.get('/api/notifications/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const notifications = await Notification.find({ 
      recipient: address.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Handle candidate response to nomination
app.post('/api/voting/candidateResponse', async (req, res) => {
  try {
    const { notificationId, sessionId, userAddress, accept } = req.body;
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.recipient.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Find the session
    const session = await VotingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    // Update the candidate status
    const candidateIndex = session.candidates.findIndex(
      c => c.name === notification.data.candidateName && c.status === 'pending'
    );
    
    if (candidateIndex === -1) {
      return res.status(404).json({ success: false, message: 'Candidate nomination not found or already processed' });
    }
    
    // Update the candidate status
    session.candidates[candidateIndex].status = accept ? 'accepted' : 'rejected';
    await session.save();
    
    // Update the notification status
    notification.status = 'actioned';
    await notification.save();
    
    res.json({ 
      success: true, 
      message: accept ? 'Nomination accepted' : 'Nomination declined'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a voter to an existing voting session
app.post('/api/voting/addVoter/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { hostAddress, voter } = req.body;
    
    if (!voter || !hostAddress) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Find the voting session
    const session = await VotingSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    // Check if the requester is the host
    if (session.hostAddress.toLowerCase() !== hostAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Only the host can modify this voting session' });
    }
    
    // Check if voting is still active
    if (!session.active) {
      return res.status(400).json({ success: false, message: 'Cannot modify a closed voting session' });
    }
    
    // Process the voter - convert username to wallet address if needed
    let voterAddress;
    
    if (voter.type === 'username') {
      // Look up the wallet address for this username
      const user = await User.findOne({ username: voter.identifier });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found with this username' });
      }
      voterAddress = user.walletAddress.toLowerCase();
    } else {
      // It's already a wallet address
      voterAddress = voter.identifier.toLowerCase();
    }
    
    // Check if voter already exists
    if (session.voters.includes(voterAddress)) {
      return res.status(400).json({ success: false, message: 'This voter is already eligible to vote' });
    }
    
    // Add the voter
    session.voters.push(voterAddress);
    await session.save();
    
    res.json({ 
      success: true, 
      message: 'Voter added successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all voting sessions
app.get('/api/voting/sessions', async (req, res) => {
  try {
    const sessions = await VotingSession.find({});
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update voting session dates
app.post('/api/voting/updateDates/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { hostAddress, startDate, endDate, resultDate } = req.body;
    
    if (!startDate || !endDate || !resultDate || !hostAddress) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Find the voting session
    const session = await VotingSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Voting session not found' });
    }
    
    // Check if the requester is the host
    if (session.hostAddress.toLowerCase() !== hostAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Only the host can modify this voting session' });
    }
    
    // Check if voting is still active
    if (!session.active) {
      return res.status(400).json({ success: false, message: 'Cannot modify a closed voting session' });
    }
    
    // Validate dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result = new Date(resultDate);
    
    if (start < now) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }
    
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    
    if (result < end) {
      return res.status(400).json({ success: false, message: 'Result declaration must be after voting ends' });
    }
    
    // Update the session
    session.startDate = startDate;
    session.endDate = endDate;
    session.resultDate = resultDate;
    await session.save();
    
    res.json({ 
      success: true, 
      message: 'Dates updated successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});