import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';

const Results = () => {
  const { contract } = useContext(Web3Context);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState(null);
  const [votingClosed, setVotingClosed] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (contract) {
        try {
          // Check if voting is closed
          const isClosed = await contract.votingClosed();
          setVotingClosed(isClosed);
          
          // Fetch candidates with vote counts
          const candidatesList = await contract.getCandidates();
          setCandidates(candidatesList);
          
          // Determine the winner (candidate with most votes)
          if (candidatesList.length > 0) {
            let maxVotes = 0;
            let winningCandidate = null;
            
            candidatesList.forEach(candidate => {
              if (parseInt(candidate.voteCount) > maxVotes) {
                maxVotes = parseInt(candidate.voteCount);
                winningCandidate = candidate;
              }
            });
            
            setWinner(winningCandidate);
          }
        } catch (error) {
          console.error("Error fetching results:", error);
        }
      }
      setLoading(false);
    };

    fetchResults();
    
    // Set up polling to refresh results every 10 seconds
    const interval = setInterval(fetchResults, 10000);
    
    return () => clearInterval(interval);
  }, [contract]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Election Results</h1>
      
      {votingClosed ? (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 text-center">
          Voting has ended. Final results are displayed below.
        </div>
      ) : (
        <div className="bg-blue-100 text-blue-700 p-4 rounded-lg mb-6 text-center">
          Voting is still open. Results are updating in real-time.
        </div>
      )}
      
      {winner && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-2">Current Leader</h2>
          <div className="flex items-center">
            <div className="bg-yellow-100 p-4 rounded-full mr-4">
              <span className="text-yellow-700 text-2xl">👑</span>
            </div>
            <div>
              <div className="text-xl font-bold">{winner.name}</div>
              <div className="text-gray-600">
                {winner.voteCount.toString()} vote{parseInt(winner.voteCount) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-100 p-4 font-semibold">
          <div>Candidate</div>
          <div>ID</div>
          <div>Votes</div>
        </div>
        
        {candidates.length > 0 ? (
          candidates
            .sort((a, b) => parseInt(b.voteCount) - parseInt(a.voteCount))
            .map((candidate, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-3 p-4 border-t border-gray-200 ${winner && winner.id.toString() === candidate.id.toString() ? 'bg-yellow-50' : ''}`}
              >
                <div className="font-medium">{candidate.name}</div>
                <div>{candidate.id.toString()}</div>
                <div>
                  <span className="font-semibold">{candidate.voteCount.toString()}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${candidates.length > 0 && Math.max(...candidates.map(c => parseInt(c.voteCount))) > 0 
                          ? (parseInt(candidate.voteCount) / Math.max(...candidates.map(c => parseInt(c.voteCount)))) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No candidates or votes available yet.
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        Results update automatically every 10 seconds
      </div>
    </div>
  );
};

export default Results;