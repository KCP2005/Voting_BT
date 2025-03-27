import React, { createContext, useState, useEffect } from 'react';
import Web3 from 'web3';  // Add this import

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [networkId, setNetworkId] = useState(null);

  // Add debug logs
  console.log("Web3Context state:", { account, isAuthenticated });

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setIsAuthenticated(true);
        
        // Get network ID
        const netId = await web3Instance.eth.net.getId();
        setNetworkId(netId);
        
        console.log("Wallet connected:", accounts[0]);
        
        // Setup event listeners
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length === 0) {
            // User disconnected their wallet
            setAccount(null);
            setIsAuthenticated(false);
          } else {
            setAccount(newAccounts[0]);
            setIsAuthenticated(true);
          }
        });
        
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
        
        return true;
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        return false;
      }
    } else {
      console.error("Ethereum wallet not detected");
      return false;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsAuthenticated(false);
  };

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            setIsAuthenticated(true);
            
            const netId = await web3Instance.eth.net.getId();
            setNetworkId(netId);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkConnection();
  }, []);

  return (
    <Web3Context.Provider value={{ 
      web3, 
      account, 
      isAuthenticated, 
      networkId,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </Web3Context.Provider>
  );
};