import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VotingArtifact from '../artifacts/contracts/Voting.sol/Voting.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          setAccount(account);

          // Create ethers provider and contract instance
          // Updated for ethers v6
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);

          // Replace with your deployed contract address
          const contractAddress = "YOUR_CONTRACT_ADDRESS";
          const contract = new ethers.Contract(
            contractAddress,
            VotingArtifact.abi,
            await provider.getSigner()
          );
          setContract(contract);

          // Check if current user is admin
          const admin = await contract.admin();
          setIsAdmin(account.toLowerCase() === admin.toLowerCase());

          setLoading(false);

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
            window.location.reload();
          });
        } catch (error) {
          console.error("Error initializing web3:", error);
          setLoading(false);
        }
      } else {
        console.log("Please install MetaMask!");
        setLoading(false);
      }
    };

    init();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <Web3Context.Provider value={{ 
      account, 
      contract, 
      provider, 
      isAdmin, 
      loading, 
      connectWallet 
    }}>
      {children}
    </Web3Context.Provider>
  );
};