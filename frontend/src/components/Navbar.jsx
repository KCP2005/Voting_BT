import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';

const Navbar = () => {
  const { account, connectWallet, isAdmin } = useContext(Web3Context);

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">Blockchain Voting</Link>
          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            <Link to="/register" className="hover:text-blue-200">Register</Link>
            <Link to="/vote" className="hover:text-blue-200">Vote</Link>
            <Link to="/results" className="hover:text-blue-200">Results</Link>
            {isAdmin && (
              <Link to="/admin" className="hover:text-blue-200">Admin</Link>
            )}
            {account ? (
              <div className="bg-blue-700 px-4 py-2 rounded-full">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;