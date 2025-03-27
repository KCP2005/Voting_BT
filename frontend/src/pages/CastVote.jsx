import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const CastVote = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { account, isAuthenticated, castVote } = useContext(Web3Context);
  
  const [session, setSession] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  useEffect(() => {
    if (sessionId && account) {
      fetchSessionDetails();
      checkVotingStatus();
    }
  }, [sessionId, account]);
  
  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/voting/session/${sessionId}`);
      setSession(response.data.session);
    } catch (error) {
      console.error("Error fetching session details:", error);
      setMessage("Error loading voting session details");
    } finally {
      setLoading(false);
    }
  };
  
  const checkVotingStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/voting/status/${sessionId}/${account}`);
      setHasVoted(response.data.hasVoted);
      setIsEligible(response.data.isEligible);
    } catch (error) {
      console.error("Error checking voting status:", error);
    }
  };
  
  const handleVote = async () => {
    if (!selectedCandidate) {
      setMessage("Please select a candidate");
      setSuccess(false);
      return;
    }
    
    setVoting(true);
    setMessage('');
    
    try {
      // Check if the session has a blockchain ID
      if (!session.blockchainId) {
        setSuccess(false);
        setMessage('This voting session is not connected to the blockchain');
        setVoting(false);
        return;
      }
      
      // Find the candidate index in the array
      const candidateIndex = session.candidates.findIndex(c => c === selectedCandidate);
      if (candidateIndex === -1) {
        setSuccess(false);
        setMessage('Invalid candidate selection');
        setVoting(false);
        return;
      }
      
      // First cast vote on blockchain
      console.log(`Casting vote on blockchain for session ${session.blockchainId}, candidate index ${candidateIndex}`);
      const blockchainResponse = await castVote(session.blockchainId, candidateIndex);
      
      if (!blockchainResponse.success) {
        setSuccess(false);
        setMessage(`Blockchain error: ${blockchainResponse.message}`);
        setVoting(false);
        return;
      }
      
      // Save transaction hash
      setTxHash(blockchainResponse.txHash);
      
      // Then record vote in database
      const dbResponse = await axios.post(`http://localhost:5001/api/voting/vote/${sessionId}`, {
        voterAddress: account,
        candidateName: selectedCandidate,
        txHash: blockchainResponse.txHash
      });
      
      if (dbResponse.data.success) {
        setSuccess(true);
        setMessage('Your vote has been cast successfully and recorded on the blockchain!');
        setHasVoted(true);
      } else {
        setSuccess(false);
        setMessage(dbResponse.data.message || 'Failed to record vote in database');
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      setSuccess(false);
      setMessage(error.response?.data?.message || 'Error casting vote');
    } finally {
      setVoting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Loading...</h1>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Cast Your Vote</h1>
        <p className="text-center text-red-600">Please connect your wallet to vote.</p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Voting Session Not Found</h1>
        <p className="text-center">The voting session you're looking for doesn't exist or has been removed.</p>
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/voting')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Available Sessions
          </button>
        </div>
      </div>
    );
  }
  
  if (!isEligible) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{session.name}</h1>
        <p className="text-center text-red-600">You are not eligible to vote in this session.</p>
      </div>
    );
  }
  
  if (hasVoted) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{session.name}</h1>
        <p className="text-center text-green-600">You have already cast your vote in this session.</p>
        <p className="text-center mt-4">Results will be available after {new Date(session.resultDate).toLocaleString()}</p>
        {txHash && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Transaction Hash:</p>
            <a 
              href={`https://etherscan.io/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {txHash}
            </a>
          </div>
        )}
      </div>
    );
  }
  
  const now = new Date();
  const startDate = new Date(session.startDate);
  const endDate = new Date(session.endDate);
  
  if (now < startDate) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{session.name}</h1>
        <p className="text-center text-yellow-600">Voting has not started yet.</p>
        <p className="text-center mt-4">Voting begins at {startDate.toLocaleString()}</p>
      </div>
    );
  }
  
  if (now > endDate) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{session.name}</h1>
        <p className="text-center text-red-600">Voting has ended.</p>
        <p className="text-center mt-4">Results will be available after {new Date(session.resultDate).toLocaleString()}</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">{session.name}</h1>
      <p className="text-gray-600 mb-6 text-center">{session.description}</p>
      
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Voting ends at: {endDate.toLocaleString()}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select a Candidate:</h2>
        <div className="space-y-3">
          {session.candidates.map((candidate, index) => (
            <div 
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCandidate === candidate 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedCandidate(candidate)}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border ${
                  selectedCandidate === candidate 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-400'
                } mr-3`}>
                  {selectedCandidate === candidate && (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-lg">{candidate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      <div className="text-center">
        <button
          onClick={handleVote}
          disabled={voting || !selectedCandidate}
          className={`px-6 py-3 rounded-lg ${
            voting || !selectedCandidate
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {voting ? 'Casting Vote on Blockchain...' : 'Cast Vote'}
        </button>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Your vote will be recorded on the blockchain for maximum transparency and security.</p>
        <p className="mt-2">Wallet address: {account}</p>
        {session.blockchainId && (
          <p className="mt-2">Blockchain Session ID: {session.blockchainId}</p>
        )}
      </div>
    </div>
  );
};

export default CastVote;