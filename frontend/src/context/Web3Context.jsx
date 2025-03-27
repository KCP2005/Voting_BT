import React, { createContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import VotingContractArtifact from '../artifacts/contracts/VotingContract.sol/VotingContract.json';
import contractAddressFile from '../contractAddress.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [votingContract, setVotingContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contract address from the deployed contract
  const contractAddress = contractAddressFile.address;

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        // Check if MetaMask is installed
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
          setIsAuthenticated(true);
          
          // Initialize contract
          const contract = new web3Instance.eth.Contract(
            VotingContractArtifact.abi,
            contractAddress
          );
          setVotingContract(contract);
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
            setIsAuthenticated(accounts.length > 0);
          });
          
        } else {
          setError('Please install MetaMask to use this application');
        }
      } catch (error) {
        console.error('Error initializing web3:', error);
        setError('Error connecting to blockchain. Please make sure MetaMask is installed and connected.');
      } finally {
        setLoading(false);
      }
    };
    
    initWeb3();
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [contractAddress]);

  // Function to create a voting session on the blockchain
  const createVotingSession = async (
    name,
    description,
    candidates,
    voters,
    startTime,
    endTime,
    resultTime
  ) => {
    if (!votingContract || !account) return { success: false, message: 'Web3 not initialized' };
    
    try {
      const voterAddresses = voters.map(voter => 
        voter.type === 'address' ? voter.identifier : null
      ).filter(address => address !== null);
      
      const tx = await votingContract.methods.createVotingSession(
        name,
        description,
        candidates,
        voterAddresses,
        Math.floor(startTime / 1000), // Convert to Unix timestamp
        Math.floor(endTime / 1000),
        Math.floor(resultTime / 1000)
      ).send({ from: account });
      
      return { 
        success: true, 
        sessionId: tx.events.SessionCreated.returnValues.sessionId,
        txHash: tx.transactionHash
      };
    } catch (error) {
      console.error('Error creating voting session:', error);
      return { success: false, message: error.message };
    }
  };

  // Function to cast a vote
  const castVote = async (sessionId, candidateId) => {
    if (!votingContract || !account) return { success: false, message: 'Web3 not initialized' };
    
    try {
      const tx = await votingContract.methods.castVote(
        sessionId,
        candidateId
      ).send({ from: account });
      
      return { success: true, txHash: tx.transactionHash };
    } catch (error) {
      console.error('Error casting vote:', error);
      return { success: false, message: error.message };
    }
  };

  // Function to add a voter
  const addVoter = async (sessionId, voterAddress) => {
    if (!votingContract || !account) return { success: false, message: 'Web3 not initialized' };
    
    try {
      const tx = await votingContract.methods.addVoter(
        sessionId,
        voterAddress
      ).send({ from: account });
      
      return { success: true, txHash: tx.transactionHash };
    } catch (error) {
      console.error('Error adding voter:', error);
      return { success: false, message: error.message };
    }
  };

  // Function to close a voting session
  const closeVotingSession = async (sessionId) => {
    if (!votingContract || !account) return { success: false, message: 'Web3 not initialized' };
    
    try {
      const tx = await votingContract.methods.closeSession(
        sessionId
      ).send({ from: account });
      
      return { success: true, txHash: tx.transactionHash };
    } catch (error) {
      console.error('Error closing voting session:', error);
      return { success: false, message: error.message };
    }
  };

  // Function to get session details
  const getSessionDetails = async (sessionId) => {
    if (!votingContract) return { success: false, message: 'Web3 not initialized' };
    
    try {
      const details = await votingContract.methods.getSessionDetails(sessionId).call();
      
      return { 
        success: true, 
        session: {
          host: details.host,
          name: details.name,
          description: details.description,
          startTime: new Date(details.startTime * 1000),
          endTime: new Date(details.endTime * 1000),
          resultTime: new Date(details.resultTime * 1000),
          active: details.active,
          candidates: details.candidateNames,
          voterCount: details.voterCount
        }
      };
    } catch (error) {
      console.error('Error getting session details:', error);
      return { success: false, message: error.message };
    }
  };

  // Function to get host sessions
  const getHostSessions = async () => {
    if (!votingContract || !account) return { success: false, message: 'Web3 not initialized' };
    
    try {
      const sessionIds = await votingContract.methods.getHostSessions().call({ from: account });
      const sessions = [];
      
      for (const id of sessionIds) {
        const details = await getSessionDetails(id);
        if (details.success) {
          sessions.push({
            id,
            ...details.session
          });
        }
      }
      
      return { success: true, sessions };
    } catch (error) {
      console.error('Error getting host sessions:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        isAuthenticated,
        votingContract,
        loading,
        error,
        createVotingSession,
        castVote,
        addVoter,
        closeVotingSession,
        getSessionDetails,
        getHostSessions
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};