import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';

const Navbar = () => {
  const { account, isAuthenticated, connectWallet, disconnectWallet } = useContext(Web3Context);

  // Add debug log
  console.log("Navbar component state:", { account, isAuthenticated });

  const handleConnectWallet = async () => {
    const success = await connectWallet();
    if (success) {
      console.log("Wallet connected successfully");
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Voting dApp</Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-blue-200">Home</Link>
          <Link to="/register" className="hover:text-blue-200">Register</Link>
          <Link to="/vote" className="hover:text-blue-200">Vote</Link>
          <Link to="/results" className="hover:text-blue-200">Results</Link>
          <Link to="/host" className="hover:text-blue-200">Host</Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-blue-700 px-2 py-1 rounded">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              <button 
                onClick={disconnectWallet}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnectWallet}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;