import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Home = () => {
  const { account, contract, connectWallet } = useContext(Web3Context);
  const [candidates, setCandidates] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (contract && account) {
        try {
          // Fetch candidates from blockchain
          const candidatesList = await contract.getCandidates();
          setCandidates(candidatesList);
          
          // Check if user is registered
          const response = await axios.get(`http://localhost:5000/check/${account}`);
          setIsRegistered(response.data.registered);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [contract, account]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Blockchain-Based Voting System</h1>
      
      {!account ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Secure Voting</h2>
          <p className="mb-6">Connect your wallet to get started with blockchain voting</p>
          <button 
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Welcome, Voter</h2>
          <p className="mb-6">Your wallet: {account}</p>
          
          {isRegistered ? (
            <div>
              <p className="text-green-600 mb-4">You are registered to vote!</p>
              <Link 
                to="/vote" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
              >
                Go to Voting
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-yellow-600 mb-4">You need to register before voting</p>
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
              >
                Register to Vote
              </Link>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Current Candidates</h2>
        {candidates.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-100 p-4 font-semibold">
              <div>Candidate Name</div>
              <div>ID</div>
            </div>
            {candidates.map((candidate, index) => (
              <div key={index} className="grid grid-cols-2 p-4 border-t border-gray-200">
                <div>{candidate.name}</div>
                <div>{candidate.id.toString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No candidates available yet.</p>
        )}
      </div>
    </div>
  );
};

export default Home;