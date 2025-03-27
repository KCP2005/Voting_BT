import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Register = () => {
  const { account, isAuthenticated } = useContext(Web3Context);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (account) {
      checkRegistration();
    }
  }, [account]);

  // Add a debug log to see what's happening
  console.log("Register component state:", { account, isAuthenticated });

  const checkRegistration = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/check/${account}`);
      setIsRegistered(response.data.registered);
    } catch (error) {
      console.error("Error checking registration:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage('Please enter a username');
      setSuccess(false);
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/users/register', {
        walletAddress: account,
        username: username
      });
      
      if (response.data.success) {
        setSuccess(true);
        setMessage('Registration successful!');
        setIsRegistered(true);
      } else {
        setSuccess(false);
        setMessage(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Error registering:", error);
      setSuccess(false);
      setMessage(error.response?.data?.message || 'Error during registration');
    } finally {
      setLoading(false);
    }
  };

  // The issue might be here - let's modify the condition
  if (!account) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Register to Vote</h1>
        <p className="text-center text-red-600">Please connect your wallet to register</p>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Already Registered</h1>
        <p className="text-center text-green-600">Your wallet is already registered to vote!</p>
        <div className="mt-4 text-center">
          <p>Wallet Address: {account}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Register to Vote</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Wallet Address:</label>
          <input
            type="text"
            value={account}
            disabled
            className="w-full p-2 border rounded-lg bg-gray-100"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Choose a username"
          />
          <p className="text-sm text-gray-500 mt-1">
            This username will be used to identify you in voting sessions.
          </p>
        </div>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;