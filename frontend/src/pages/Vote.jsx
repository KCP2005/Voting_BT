import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Vote = () => {
  const { account, isAuthenticated } = useContext(Web3Context);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    if (account) {
      fetchEligibleSessions();
    } else {
      setLoading(false);
    }
  }, [account]);

  const fetchEligibleSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/voting/voter/${account}`);
      setSessions(response.data.sessions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching eligible sessions:", error);
      setLoading(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setSelectedCandidate('');
    setMessage('');
    setSuccess(false);
  };

  const handleVote = async () => {
    if (!selectedCandidate) {
      setMessage('Please select a candidate');
      return;
    }

    setVoteLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/voting/vote', {
        sessionId: selectedSession._id,
        voter: account,
        candidate: selectedCandidate
      });
      
      if (response.data.success) {
        setSuccess(true);
        setMessage('Your vote has been cast successfully!');
        // Refresh the sessions list
        fetchEligibleSessions();
      } else {
        setMessage(response.data.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      setMessage(error.response?.data?.message || 'Error casting vote');
    } finally {
      setVoteLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Cast Your Vote</h1>
        <p className="text-center text-red-600">Please connect your wallet and register to vote.</p>
      </div>
    );
  }

  const canVote = (session) => {
    const now = new Date();
    const start = new Date(session.startDate);
    const end = new Date(session.endDate);
    
    return now >= start && now <= end && session.active;
  };

  const renderVotingStatus = (session) => {
    const now = new Date();
    const start = new Date(session.startDate);
    const end = new Date(session.endDate);
    const result = new Date(session.resultDate);
    
    if (!session.active) {
      return <span className="text-red-600">Closed</span>;
    }
    
    if (now < start) {
      return <span className="text-yellow-600">Voting starts on {start.toLocaleDateString()} at {start.toLocaleTimeString()}</span>;
    }
    
    if (now > end) {
      if (now < result) {
        return <span className="text-blue-600">Voting ended. Results will be declared on {result.toLocaleDateString()} at {result.toLocaleTimeString()}</span>;
      } else {
        return <span className="text-green-600">Results declared</span>;
      }
    }
    
    return <span className="text-green-600">Voting in progress</span>;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Cast Your Vote</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading available voting sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p>You are not eligible to vote in any active voting sessions.</p>
        </div>
      ) : !selectedSession ? (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select a Voting Session</h2>
          <div className="space-y-4">
            {sessions.map((session) => {
              // Check if user has already voted
              const hasVoted = session.votes.some(vote => vote.voter.toLowerCase() === account.toLowerCase());
              
              return (
                <div key={session._id} className="border p-4 rounded-lg">
                  <h3 className="font-bold">{session.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{session.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm">{session.candidates.length} candidates</span>
                    {hasVoted ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        You have voted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSessionSelect(session)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Vote in this session
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{selectedSession.name}</h2>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-blue-600 hover:underline"
            >
              Back to sessions
            </button>
          </div>
          
          {selectedSession.description && (
            <p className="text-gray-600 mb-6">{selectedSession.description}</p>
          )}
          
          <h3 className="font-semibold mb-3">Select a candidate:</h3>
          <div className="space-y-2 mb-6">
            {selectedSession.candidates.map((candidate, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`candidate-${index}`}
                  name="candidate"
                  value={candidate}
                  checked={selectedCandidate === candidate}
                  onChange={() => setSelectedCandidate(candidate)}
                  className="mr-2"
                />
                <label htmlFor={`candidate-${index}`}>{candidate}</label>
              </div>
            ))}
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          
          <button
            onClick={handleVote}
            disabled={voteLoading || success}
            className={`w-full py-2 rounded-lg ${voteLoading || success ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {voteLoading ? 'Casting Vote...' : success ? 'Vote Cast' : 'Cast Vote'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Vote;