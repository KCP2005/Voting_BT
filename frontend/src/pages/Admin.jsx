import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { ethers } from 'ethers';

const Admin = () => {
  const { account, contract, isAdmin } = useContext(Web3Context);
  const [candidates, setCandidates] = useState([]);
  const [newCandidate, setNewCandidate] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [votingClosed, setVotingClosed] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (contract) {
        try {
          // Check if voting is closed
          const isClosed = await contract.votingClosed();
          setVotingClosed(isClosed);
          
          // Fetch candidates
          const candidatesList = await contract.getCandidates();
          setCandidates(candidatesList);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [contract]);

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.trim()) {
      setMessage('Please enter a candidate name');
      return;
    }

    setTransactionPending(true);
    setMessage('Adding candidate...');
    
    try {
      const tx = await contract.addCandidate(newCandidate);
      setMessage('Transaction submitted, waiting for confirmation...');
      
      await tx.wait();
      
      // Refresh candidates list
      const candidatesList = await contract.getCandidates();
      setCandidates(candidatesList);
      
      setMessage(`Candidate "${newCandidate}" added successfully!`);
      setNewCandidate('');
    } catch (error) {
      console.error("Error adding candidate:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setTransactionPending(false);
    }
  };

  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    if (!voterAddress || !ethers.isAddress(voterAddress)) {
      setMessage('Please enter a valid Ethereum address');
      return;
    }

    setTransactionPending(true);
    setMessage('Registering voter...');
    
    try {
      const tx = await contract.registerVoter(voterAddress);
      setMessage('Transaction submitted, waiting for confirmation...');
      
      await tx.wait();
      
      setMessage(`Voter ${voterAddress} registered successfully!`);
      setVoterAddress('');
    } catch (error) {
      console.error("Error registering voter:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setTransactionPending(false);
    }
  };

  const handleCloseVoting = async () => {
    if (!window.confirm('Are you sure you want to close voting? This action cannot be undone.')) {
      return;
    }

    setTransactionPending(true);
    setMessage('Closing voting...');
    
    try {
      const tx = await contract.closeVoting();
      setMessage('Transaction submitted, waiting for confirmation...');
      
      await tx.wait();
      
      setVotingClosed(true);
      setMessage('Voting has been closed successfully!');
    } catch (error) {
      console.error("Error closing voting:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setTransactionPending(false);
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
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-4">Please connect your wallet to access admin features</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-red-600 mb-4">You do not have admin privileges</p>
        <p className="text-gray-600">Only the contract owner can access this page</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>
      
      {votingClosed ? (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-6 text-center">
          Voting is closed. Results are final.
        </div>
      ) : (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 text-center">
          Voting is currently open
        </div>
      )}
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Candidate Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add Candidate</h2>
          <form onSubmit={handleAddCandidate}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Candidate Name:</label>
              <input
                type="text"
                value={newCandidate}
                onChange={(e) => setNewCandidate(e.target.value)}
                disabled={votingClosed || transactionPending}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter candidate name"
              />
            </div>
            <button
              type="submit"
              disabled={votingClosed || !newCandidate.trim() || transactionPending}
              className={`w-full py-2 rounded-lg ${votingClosed || !newCandidate.trim() || transactionPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {transactionPending ? 'Processing...' : 'Add Candidate'}
            </button>
          </form>
        </div>
        
        {/* Register Voter Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Register Voter</h2>
          <form onSubmit={handleRegisterVoter}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Wallet Address:</label>
              <input
                type="text"
                value={voterAddress}
                onChange={(e) => setVoterAddress(e.target.value)}
                disabled={votingClosed || transactionPending}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter wallet address (0x...)"
              />
            </div>
            <button
              type="submit"
              disabled={votingClosed || !voterAddress || transactionPending}
              className={`w-full py-2 rounded-lg ${votingClosed || !voterAddress || transactionPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {transactionPending ? 'Processing...' : 'Register Voter'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Candidates List */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b">Current Candidates</h2>
        
        {candidates.length > 0 ? (
          <div>
            <div className="grid grid-cols-3 bg-gray-100 p-4 font-semibold">
              <div>ID</div>
              <div>Name</div>
              <div>Votes</div>
            </div>
            {candidates.map((candidate, index) => (
              <div key={index} className="grid grid-cols-3 p-4 border-t border-gray-200">
                <div>{candidate.id.toString()}</div>
                <div>{candidate.name}</div>
                <div>{candidate.voteCount.toString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No candidates added yet.
          </div>
        )}
      </div>
      
      {/* Close Voting Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleCloseVoting}
          disabled={votingClosed || transactionPending}
          className={`px-6 py-3 rounded-lg ${votingClosed ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
        >
          {votingClosed ? 'Voting Closed' : transactionPending ? 'Processing...' : 'Close Voting'}
        </button>
        {!votingClosed && (
          <p className="mt-2 text-sm text-gray-600">
            Warning: Closing the voting is irreversible
          </p>
        )}
      </div>
    </div>
  );
};

export default Admin;