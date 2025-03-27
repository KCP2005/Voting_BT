import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const Results = () => {
  const { account } = useContext(Web3Context);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const fetchAllSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/voting/sessions');
      setSessions(response.data.sessions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setLoading(false);
    }
  };

  const fetchResults = async (sessionId) => {
    setResultsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/voting/results/${sessionId}`);
      setResults(response.data);
      setResultsLoading(false);
    } catch (error) {
      console.error("Error fetching results:", error);
      setResultsLoading(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    fetchResults(session._id);
  };

  const canShowResults = (session) => {
    const now = new Date();
    const resultDate = new Date(session.resultDate);
    return now >= resultDate;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Voting Results</h1>
      
      {sessions.map(session => (
        <div key={session._id} className="bg-white p-6 rounded-lg shadow-md mb-4">
          <h2 className="text-xl font-semibold mb-2">{session.name}</h2>
          <p className="text-gray-600 mb-4">{session.description}</p>
          
          <div className="mb-4">
            <button
              onClick={() => fetchResults(session._id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              View Results
            </button>
          </div>
          
          {/* Fix the syntax error here - there was likely a missing closing bracket or parenthesis */}
          {selectedSession === session._id && (
            <div>
              {resultsLoading ? (
                <div className="text-center py-8">Loading results...</div>
              ) : results ? (
                <div>
                  <h3 className="font-semibold mb-3">Results:</h3>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <span>{result.candidate}</span>
                        <span className="font-semibold">{result.votes} votes</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    Total votes: {results.reduce((sum, r) => sum + r.votes, 0)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600">No results available</div>
              )}
            </div>
          )}
      </div>
    ))}
  </div>
);
};

export default Results;