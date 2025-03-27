// Add these routes to your existing votingRoutes.js file

// Update blockchain ID for a session
router.post('/updateBlockchainId/:id', async (req, res) => {
  try {
    const { blockchainId, txHash } = req.body;
    
    const session = await VotingSession.findByIdAndUpdate(
      req.params.id,
      { 
        blockchainId,
        blockchainTxHash: txHash
      },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating blockchain ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get voting results
router.get('/results/:id', async (req, res) => {
  try {
    const session = await VotingSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Check if results can be shown
    const now = new Date();
    const resultDate = new Date(session.resultDate);
    
    if (now < resultDate && session.active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Results are not available yet' 
      });
    }
    
    // Count votes for each candidate
    const results = [];
    
    for (const candidate of session.candidates) {
      const voteCount = session.votes.filter(vote => vote.candidate === candidate).length;
      results.push({
        name: candidate,
        votes: voteCount
      });
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Revert a vote (used when blockchain transaction fails)
router.post('/revertVote/:id', async (req, res) => {
  try {
    const { voterAddress } = req.body;
    
    const session = await VotingSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Remove the vote
    session.votes = session.votes.filter(vote => vote.voter !== voterAddress);
    await session.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reverting vote:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update the vote route to accept txHash

router.post('/vote/:id', async (req, res) => {
  try {
    const { voterAddress, candidateName, txHash } = req.body;
    
    const session = await VotingSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Check if voting is active
    const now = new Date();
    const startDate = new Date(session.startDate);
    const endDate = new Date(session.endDate);
    
    if (now < startDate) {
      return res.status(403).json({ success: false, message: 'Voting has not started yet' });
    }
    
    if (now > endDate) {
      return res.status(403).json({ success: false, message: 'Voting has ended' });
    }
    
    // Check if voter is eligible
    const voter = session.voters.find(v => v.identifier === voterAddress && v.type === 'address');
    if (!voter) {
      return res.status(403).json({ success: false, message: 'You are not eligible to vote in this session' });
    }
    
    // Check if voter has already voted
    const existingVote = session.votes.find(v => v.voter === voterAddress);
    if (existingVote) {
      return res.status(403).json({ success: false, message: 'You have already voted in this session' });
    }
    
    // Check if candidate exists
    if (!session.candidates.includes(candidateName)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate' });
    }
    
    // Add vote
    session.votes.push({
      voter: voterAddress,
      candidate: candidateName,
      timestamp: new Date(),
      txHash: txHash || null
    });
    
    await session.save();
    
    res.json({ success: true, message: 'Vote cast successfully' });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});