import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Register = () => {
  const { account, connectWallet } = useContext(Web3Context);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistration = async () => {
      if (account) {
        try {
          const response = await axios.get(`http://localhost:5000/check/${account}`);
          setIsRegistered(response.data.registered);
          if (response.data.registered) {
            setMessage('You are already registered!');
          }
        } catch (error) {
          console.error("Error checking registration:", error);
        }
      }
    };

    checkRegistration();
  }, [account]);

  const handleRegister = async () => {
    if (!account) {
      setMessage('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/register', {
        walletAddress: account
      });

      if (response.data.success) {
        setMessage('Registration successful!');
        setIsRegistered(true);
        setTimeout(() => {
          navigate('/vote');
        }, 2000);
      } else {
        setMessage(response.data.message || 'Registration failed');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Voter Registration</h1>
      
      {!account ? (
        <div className="text-center">
          <p className="mb-4">Please connect your wallet to register</p>
          <button 
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Your Wallet Address:</label>
            <div className="bg-gray-100 p-3 rounded-lg break-all">
              {account}
            </div>
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${isRegistered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <button 
              onClick={handleRegister}
              disabled={isRegistered || loading}
              className={`px-6 py-2 rounded-lg ${isRegistered || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {loading ? 'Processing...' : isRegistered ? 'Registered' : 'Register to Vote'}
            </button>
            
            {isRegistered && (
              <button 
                onClick={() => navigate('/vote')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Go to Voting
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;