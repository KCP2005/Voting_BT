import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Vote = () => {
  const { account, contract } = useContext(Web3Context);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [votingStatus, setVotingStatus] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (contract && account) {
        try {
          // Check if voting is closed
          const votingClosed = await contract.votingClosed();
          if (votingClosed) {
            setVotingStatus('Voting is closed');
            setLoading(false);
            return;
          }
          
          // Fetch candidates from blockchain
          const candidatesList = await contract.getCandidates();
          setCandidates(candidatesList);
          
          // Check if user is registered and has voted
          const response = await axios.get(`http://localhost:5000/check/${account}`);
          setIsRegistered(response.data.registered);
          setHasVoted(response.data.hasVoted);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [contract, account]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setVotingStatus('Please select a candidate');
      return;
    }

    setVotingStatus('Processing your vote...');
    try {
      // Call the vote function on the smart contract
      const tx = await contract.vote(selectedCandidate);
      setVotingStatus('Transaction submitted, waiting for confirmation...');
      
      // Wait for transaction to be mined
      await tx.wait();
      setTransactionHash(tx.hash);
      
      // Update backend
      await axios.post('http://localhost:5000/vote', {
        walletAddress: account
      });
      
      setHasVoted(true);
      setVotingStatus('Your vote has been recorded successfully!');
    } catch (error) {
      console.error("Error voting:", error);
      setVotingStatus(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Voting Page</h1>
        <p className="mb-4">Please connect your wallet to vote</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Voting Page</h1>
        <p className="text-yellow-600 mb-4">You are not registered to vote</p>
        <a href="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Register to Vote
        </a>
      </div>
    );
  }

  if (votingStatus === 'Voting is closed') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Voting Page</h1>
        <p className="text-red-600 mb-4">Voting is currently closed</p>
        <a href="/results" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          View Results
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Cast Your Vote</h1>
      
      {hasVoted ? (
        <div className="text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
            You have already voted!
          </div>
          {transactionHash && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
              <a 
                href={`https://etherscan.io/tx/${transactionHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 break-all hover:underline"
              >
                {transactionHash}
              </a>
            </div>
          )}
          <a href="/results" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            View Results
          </a>
        </div>
      ) : (
        <div>
          <p className="mb-4">Select a candidate to vote:</p>
          
          <div className="space-y-2 mb-6">
            {candidates.map((candidate) => (
              <div 
                key={candidate.id.toString()}
                className={`p-4 border rounded-lg cursor-pointer ${selectedCandidate === candidate.id.toString() ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setSelectedCandidate(candidate.id.toString())}
              >
                <div className="font-medium">{candidate.name}</div>
                <div className="text-sm text-gray-500">ID: {candidate.id.toString()}</div>
              </div>
            ))}
          </div>
          
          {votingStatus && (
            <div className={`p-3 rounded-lg mb-4 ${votingStatus.includes('success') ? 'bg-green-100 text-green-700' : votingStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {votingStatus}
            </div>
          )}
          
          <button 
            onClick={handleVote}
            disabled={!selectedCandidate || votingStatus.includes('Processing') || votingStatus.includes('submitted')}
            className={`w-full py-2 rounded-lg ${!selectedCandidate || votingStatus.includes('Processing') || votingStatus.includes('submitted') ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {votingStatus.includes('Processing') || votingStatus.includes('submitted') ? 'Processing...' : 'Submit Vote'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Vote;