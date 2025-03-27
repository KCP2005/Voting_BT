import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const VotingResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { account, votingContract } = useContext(Web3Context);
  
  const [session, setSession] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [blockchainVerified, setBlockchainVerified] = useState(false);
  
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);
  
  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/voting/session/${sessionId}`);
      setSession(response.data.session);
      
      // Check if results can be shown
      const now = new Date();
      const resultDate = new Date(response.data.session.resultDate);
      
      if (now >= resultDate || !response.data.session.active) {
        fetchResults(response.data.session);
      } else {
        setMessage(`Results will be available after ${resultDate.toLocaleString()}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
      setMessage("Error loading voting session details");
      setLoading(false);
    }
  };
  
  const fetchResults = async (sessionData) => {
    try {
      // Fetch results from database
      const dbResponse = await axios.get(`http://localhost:5001/api/voting/results/${sessionId}`);
      
      // If session has blockchain ID, verify results on blockchain
      if (sessionData.blockchainId && votingContract) {
        try {
          const blockchainResults = [];
          
          // Get vote counts from blockchain for each candidate
          for (let i = 0; i < sessionData.candidates.length; i++) {
            const voteCount = await votingContract.methods.getCandidateVotes(
              sessionData.blockchainId,
              i
            ).call();
            
            blockchainResults.push({
              name: sessionData.candidates[i],
              votes: parseInt(voteCount)
            });
          }
          
          // Compare blockchain results with database results
          const dbResults = dbResponse.data.results;
          let resultsMatch = true;
          
          if (dbResults.length === blockchainResults.length) {
            for (let i = 0; i < dbResults.length; i++) {
              const dbCandidate = dbResults.find(r => r.name === blockchainResults[i].name);
              if (!dbCandidate || dbCandidate.votes !== blockchainResults[i].votes) {
                resultsMatch = false;
                break;
              }
            }
          } else {
            resultsMatch = false;
          }
          
          setBlockchainVerified(resultsMatch);
          
          // Use blockchain results if available
          setResults(blockchainResults.sort((a, b) => b.votes - a.votes));
        } catch (error) {
          console.error("Error verifying results on blockchain:", error);
          setResults(dbResponse.data.results.sort((a, b) => b.votes - a.votes));
        }
      } else {
        // Use database results if blockchain verification is not available
        setResults(dbResponse.data.results.sort((a, b) => b.votes - a.votes));
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      setMessage("Error loading voting results");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Loading Results...</h1>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Voting Session Not Found</h1>
        <p className="text-center">The voting session you're looking for doesn't exist or has been removed.</p>
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/voting')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Available Sessions
          </button>
        </div>
      </div>
    );
  }
  
  const now = new Date();
  const resultDate = new Date(session.resultDate);
  
  if (now < resultDate && session.active) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{session.name} - Results</h1>
        <p className="text-center text-yellow-600">{message}</p>
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/voting')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Voting Sessions
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate total votes
  const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);
  
  // Find winner(s) - handle ties
  const maxVotes = results.length > 0 ? results[0].votes : 0;
  const winners = results.filter(candidate => candidate.votes === maxVotes);
  
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">{session.name} - Results</h1>
      <p className="text-gray-600 mb-6 text-center">{session.description}</p>
      
      {blockchainVerified && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-6 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Results verified on blockchain
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {winners.length > 1 ? 'Tie Between:' : 'Winner:'}
        </h2>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          {winners.map((winner, index) => (
            <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
              <span className="text-lg font-medium">{winner.name}</span>
              <div>
                <span className="text-blue-700 font-bold">{winner.votes} votes</span>
                <span className="text-gray-500 ml-2">
                  ({totalVotes > 0 ? Math.round((winner.votes / totalVotes) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">All Results:</h2>
        <div className="space-y-4">
          {results.map((candidate, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-3">
                <span className="font-medium">{candidate.name}</span>
                <div>
                  <span className="font-bold">{candidate.votes} votes</span>
                  <span className="text-gray-500 ml-2">
                    ({totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-200">
                <div 
                  className="h-full bg-blue-600"
                  style={{ width: `${totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center text-gray-500 mb-6">
        <p>Total votes: {totalVotes}</p>
        <p className="mt-1">Voting ended: {new Date(session.endDate).toLocaleString()}</p>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => navigate('/voting')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Voting Sessions
        </button>
      </div>
    </div>
  );
};

export default VotingResults;