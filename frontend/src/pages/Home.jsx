import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';

const Home = () => {
  const { account, connectWallet, isAuthenticated, authError } = useContext(Web3Context);

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
      ) : !isAuthenticated ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          {authError && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {authError}
            </div>
          )}
          <p className="mb-6">Your wallet is not registered. Please register to access the voting system.</p>
          <Link 
            to="/register" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Register Now
          </Link>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Welcome, Voter</h2>
          <p className="mb-6">Your wallet: {account}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/vote" 
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition text-center"
            >
              Cast Your Vote
            </Link>
            <Link 
              to="/results" 
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition text-center"
            >
              View Results
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;