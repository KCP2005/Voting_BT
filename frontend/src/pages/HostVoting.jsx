import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const HostVoting = () => {
  const { account, isAuthenticated } = useContext(Web3Context);
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [candidates, setCandidates] = useState([{ name: '' }]);
  const [voters, setVoters] = useState([{ identifier: '', type: 'address' }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [mySessions, setMySessions] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  
  // Date and time state variables
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultTime, setResultTime] = useState('');

  // Add state for editing dates
  const [editingDates, setEditingDates] = useState(false);
  const [updatedStartDate, setUpdatedStartDate] = useState('');
  const [updatedEndDate, setUpdatedEndDate] = useState('');
  const [updatedEndTime, setUpdatedEndTime] = useState('');
  const [updatedResultDate, setUpdatedResultDate] = useState('');
  const [updatedResultTime, setUpdatedResultTime] = useState('');

  const [selectedSession, setSelectedSession] = useState(null);
  const [newCandidate, setNewCandidate] = useState('');
  const [newVoter, setNewVoter] = useState({ identifier: '', type: 'address' });
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementMessage, setManagementMessage] = useState('');
  const [managementSuccess, setManagementSuccess] = useState(false);
  const [newCandidateUsername, setNewCandidateUsername] = useState('');

  // Function to handle date format for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Function to handle time format for input fields
  const formatTimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  // Function to initialize date editing
  const handleEditDates = () => {
    if (!selectedSession) return;
    
    setUpdatedStartDate(formatDateForInput(selectedSession.startDate));
    setUpdatedEndDate(formatDateForInput(selectedSession.endDate));
    setUpdatedEndTime(formatTimeForInput(selectedSession.endDate));
    setUpdatedResultDate(formatDateForInput(selectedSession.resultDate));
    setUpdatedResultTime(formatTimeForInput(selectedSession.resultDate));
    setEditingDates(true);
  };

  // Function to save updated dates
  const handleSaveDates = async () => {
    if (!selectedSession) return;
    
    // Validate dates
    const now = new Date();
    const start = new Date(updatedStartDate);
    const end = new Date(`${updatedEndDate}T${updatedEndTime}`);
    const resultDeclaration = new Date(`${updatedResultDate}T${updatedResultTime}`);
    
    if (start < now) {
      setManagementSuccess(false);
      setManagementMessage('Start date cannot be in the past');
      return;
    }
    
    if (end <= start) {
      setManagementSuccess(false);
      setManagementMessage('End date must be after start date');
      return;
    }
    
    if (resultDeclaration < end) {
      setManagementSuccess(false);
      setManagementMessage('Result declaration must be after voting ends');
      return;
    }
    
    setManagementLoading(true);
    try {
      const response = await axios.post(`http://localhost:5001/api/voting/updateDates/${selectedSession._id}`, {
        hostAddress: account,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        resultDate: resultDeclaration.toISOString()
      });
      
      if (response.data.success) {
        setManagementSuccess(true);
        setManagementMessage('Dates updated successfully!');
        setEditingDates(false);
        fetchMySessions();
        
        // Update the selected session with the new data
        const updatedSession = response.data.session;
        setSelectedSession(updatedSession);
      } else {
        setManagementSuccess(false);
        setManagementMessage(response.data.message || 'Failed to update dates');
      }
    } catch (error) {
      console.error("Error updating dates:", error);
      setManagementSuccess(false);
      setManagementMessage(error.response?.data?.message || 'Error updating dates');
    } finally {
      setManagementLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchMySessions();
      fetchRegisteredUsers();
    }
  }, [account, fetchMySessions]); // Add fetchMySessions to dependency array

  const fetchMySessions = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/voting/host/${account}`);
      setMySessions(response.data.sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/users/all');
      setRegisteredUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching registered users:", error);
    }
  };

  const handleAddCandidate = () => {
    setCandidates([...candidates, { name: '' }]);
  };

  const handleCandidateChange = (index, value) => {
    const newCandidates = [...candidates];
    newCandidates[index].name = value;
    setCandidates(newCandidates);
  };

  const handleRemoveCandidate = (index) => {
    const newCandidates = [...candidates];
    newCandidates.splice(index, 1);
    setCandidates(newCandidates);
  };

  const handleAddVoter = () => {
    setVoters([...voters, { identifier: '', type: 'address' }]);
  };

  const handleVoterChange = (index, value, field) => {
    const newVoters = [...voters];
    newVoters[index][field] = value;
    setVoters(newVoters);
  };

  const handleRemoveVoter = (index) => {
    const newVoters = [...voters];
    newVoters.splice(index, 1);
    setVoters(newVoters);
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setNewCandidate('');
    setNewVoter({ identifier: '', type: 'address' });
    setManagementMessage('');
    setManagementSuccess(false);
  };

  const handleAddNewCandidate = async () => {
    if (!newCandidate.trim()) {
      setManagementMessage('Please enter a candidate name');
      setManagementSuccess(false);
      return;
    }

    if (!newCandidateUsername.trim()) {
      setManagementMessage('Please enter the candidate\'s username');
      setManagementSuccess(false);
      return;
    }

    setManagementLoading(true);
    try {
      const response = await axios.post(`http://localhost:5001/api/voting/addCandidate/${selectedSession._id}`, {
        hostAddress: account,
        candidateName: newCandidate,
        candidateUsername: newCandidateUsername
      });

      if (response.data.success) {
        setManagementSuccess(true);
        setManagementMessage('Candidate nomination sent! They will need to accept to be listed.');
        setNewCandidate('');
        setNewCandidateUsername('');
        fetchMySessions();
        
        // Update the selected session with the new data
        const updatedSession = response.data.session;
        setSelectedSession(updatedSession);
      } else {
        setManagementSuccess(false);
        setManagementMessage(response.data.message || 'Failed to add candidate');
      }
    } catch (error) {
      console.error("Error adding candidate:", error);
      setManagementSuccess(false);
      setManagementMessage(error.response?.data?.message || 'Error adding candidate');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleAddNewVoter = async () => {
    if (!newVoter.identifier.trim()) {
      setManagementMessage('Please enter a voter identifier');
      setManagementSuccess(false);
      return;
    }

    setManagementLoading(true);
    try {
      const response = await axios.post(`http://localhost:5001/api/voting/addVoter/${selectedSession._id}`, {
        hostAddress: account,
        voter: newVoter
      });

      if (response.data.success) {
        setManagementSuccess(true);
        setManagementMessage('Voter added successfully!');
        setNewVoter({ identifier: '', type: 'address' });
        fetchMySessions();
        
        // Update the selected session with the new data
        const updatedSession = response.data.session;
        setSelectedSession(updatedSession);
      } else {
        setManagementSuccess(false);
        setManagementMessage(response.data.message || 'Failed to add voter');
      }
    } catch (error) {
      console.error("Error adding voter:", error);
      setManagementSuccess(false);
      setManagementMessage(error.response?.data?.message || 'Error adding voter');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!sessionName.trim()) {
      setMessage('Please enter a session name');
      return;
    }
    
    if (candidates.some(c => !c.name.trim())) {
      setMessage('Please fill in all candidate names');
      return;
    }
    
    if (voters.some(v => !v.identifier.trim())) {
      setMessage('Please fill in all voter identifiers');
      return;
    }
    
    if (!startDate) {
      setMessage('Please select a start date');
      return;
    }
    
    if (!endDate || !endTime) {
      setMessage('Please select an end date and time');
      return;
    }
    
    if (!resultDate || !resultTime) {
      setMessage('Please select a result declaration date and time');
      return;
    }
    
    // Validate dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(`${endDate}T${endTime}`);
    const resultDeclaration = new Date(`${resultDate}T${resultTime}`);
    
    if (start < now) {
      setMessage('Start date cannot be in the past');
      return;
    }
    
    if (end <= start) {
      setMessage('End date must be after start date');
      return;
    }
    
    if (resultDeclaration < end) {
      setMessage('Result declaration must be after voting ends');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/voting/create', {
        hostAddress: account,
        name: sessionName,
        description,
        candidates: candidates.map(c => c.name),
        voters: voters,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        resultDate: resultDeclaration.toISOString()
      });
      
      if (response.data.success) {
        setSuccess(true);
        setMessage('Voting session created successfully!');
        setSessionName('');
        setDescription('');
        setCandidates([{ name: '' }]);
        setVoters([{ identifier: '', type: 'address' }]);
        setStartDate('');
        setEndDate('');
        setEndTime('');
        setResultDate('');
        setResultTime('');
        fetchMySessions();
      } else {
        setMessage(response.data.message || 'Failed to create voting session');
      }
    } catch (error) {
      console.error("Error creating voting session:", error);
      setMessage(error.response?.data?.message || 'Error creating voting session');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Host a Voting Session</h1>
        <p className="text-center text-red-600">Please connect your wallet and register to host a voting session.</p>
      </div>
    );
  }

  // Remove this standalone comment and return statement
  // // Update the session management section in the render
  // return (

  // Make sure there's only one return statement in your component function
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Host a Voting Session</h1>
      
      {selectedSession ? (
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{selectedSession.name}</h2>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-blue-600 hover:underline"
            >
              Back to all sessions
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">{selectedSession.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-700 font-semibold">Candidates:</span> {selectedSession.candidates.length}
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-700 font-semibold">Eligible Voters:</span> {selectedSession.voters.length}
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-700 font-semibold">Votes Cast:</span> {selectedSession.votes?.length || 0}
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-700 font-semibold">Status:</span> {selectedSession.active ? 'Active' : 'Closed'}
              </div>
            </div>
          </div>
          
          {/* Date and Time Management Section */}
          <div className="mb-6 border-t pt-6">
            <h3 className="font-semibold mb-3">Date and Time Management:</h3>
            
            {!editingDates ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Voting Start Date:</p>
                    <p className="font-medium">{new Date(selectedSession.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Voting End Date:</p>
                    <p className="font-medium">{new Date(selectedSession.endDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Result Declaration:</p>
                    <p className="font-medium">{new Date(selectedSession.resultDate).toLocaleString()}</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleEditDates}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Edit Dates
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Voting Start Date:</label>
                    <input
                      type="date"
                      value={updatedStartDate}
                      onChange={(e) => setUpdatedStartDate(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Voting End Date:</label>
                    <input
                      type="date"
                      value={updatedEndDate}
                      onChange={(e) => setUpdatedEndDate(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Voting End Time:</label>
                    <input
                      type="time"
                      value={updatedEndTime}
                      onChange={(e) => setUpdatedEndTime(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Result Declaration Date:</label>
                    <input
                      type="date"
                      value={updatedResultDate}
                      onChange={(e) => setUpdatedResultDate(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Result Declaration Time:</label>
                    <input
                      type="time"
                      value={updatedResultTime}
                      onChange={(e) => setUpdatedResultTime(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveDates}
                    disabled={managementLoading}
                    className={`px-4 py-2 rounded-lg ${managementLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    Save Changes
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setEditingDates(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {selectedSession.active && (
            <>
              <div className="mb-6 border-t pt-6">
                <h3 className="font-semibold mb-3">Current Candidates:</h3>
                <ul className="list-disc pl-5 mb-4">
                  {selectedSession.candidates.map((candidate, index) => (
                    <li key={index} className="mb-1">{candidate}</li>
                  ))}
                </ul>
                
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newCandidate}
                    onChange={(e) => setNewCandidate(e.target.value)}
                    className="flex-grow p-2 border rounded-lg mr-2"
                    placeholder="Enter new candidate name"
                  />
                  <input
                    type="text"
                    value={newCandidateUsername}
                    onChange={(e) => setNewCandidateUsername(e.target.value)}
                    className="flex-grow p-2 border rounded-lg mr-2"
                    placeholder="Enter candidate username"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCandidate}
                    disabled={managementLoading}
                    className={`px-4 py-2 rounded-lg ${managementLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    Add Candidate
                  </button>
                </div>
              </div>
              
              <div className="mb-6 border-t pt-6">
                <h3 className="font-semibold mb-3">Add New Voter:</h3>
                <div className="flex flex-col mb-4">
                  <div className="flex mb-2">
                    <select
                      value={newVoter.type}
                      onChange={(e) => setNewVoter({...newVoter, type: e.target.value})}
                      className="p-2 border rounded-lg mr-2 w-1/4"
                    >
                      <option value="address">Wallet Address</option>
                      <option value="username">Username</option>
                    </select>
                    
                    {newVoter.type === 'username' ? (
                      <select
                        value={newVoter.identifier}
                        onChange={(e) => setNewVoter({...newVoter, identifier: e.target.value})}
                        className="flex-grow p-2 border rounded-lg mr-2"
                      >
                        <option value="">Select a registered user</option>
                        {registeredUsers.map(user => (
                          <option key={user._id} value={user.username}>
                            {user.username} ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newVoter.identifier}
                        onChange={(e) => setNewVoter({...newVoter, identifier: e.target.value})}
                        className="flex-grow p-2 border rounded-lg mr-2"
                        placeholder="Enter wallet address"
                      />
                    )}
                    
                    <button
                      type="button"
                      onClick={handleAddNewVoter}
                      disabled={managementLoading}
                      className={`px-4 py-2 rounded-lg ${managementLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      Add Voter
                    </button>
                  </div>
                </div>
              </div>
              
              {managementMessage && (
                <div className={`p-3 rounded-lg mb-4 ${managementSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {managementMessage}
                </div>
              )}
              
              <div className="border-t pt-6">
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`http://localhost:5001/api/voting/close/${selectedSession._id}`, {
                        hostAddress: account
                      });
                      fetchMySessions();
                      setSelectedSession(null);
                    } catch (error) {
                      console.error("Error closing session:", error);
                      setManagementMessage('Failed to close voting session');
                      setManagementSuccess(false);
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Close Voting Session
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Session Name:</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter voting session name"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter session description"
                  rows="3"
                />
              </div>
              
              {/* Add state for editing dates
              const [editingDates, setEditingDates] = useState(false);
              const [updatedStartDate, setUpdatedStartDate] = useState('');
              const [updatedEndDate, setUpdatedEndDate] = useState('');
              const [updatedEndTime, setUpdatedEndTime] = useState('');
              const [updatedResultDate, setUpdatedResultDate] = useState('');
              const [updatedResultTime, setUpdatedResultTime] = useState(''); */}
              
              {/* New date and time fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Voting Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Voting End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Voting End Time:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Result Declaration Date:</label>
                  <input
                    type="date"
                    value={resultDate}
                    onChange={(e) => setResultDate(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Result Declaration Time:</label>
                  <input
                    type="time"
                    value={resultTime}
                    onChange={(e) => setResultTime(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              {/* Existing candidates and voters fields */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Candidates:</label>
                {candidates.map((candidate, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={candidate.name}
                      onChange={(e) => handleCandidateChange(index, e.target.value)}
                      className="flex-grow p-2 border rounded-lg mr-2"
                      placeholder={`Candidate ${index + 1} name`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCandidate(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                      disabled={candidates.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
                >
                  Add Candidate
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Eligible Voters:</label>
                {voters.map((voter, index) => (
                  <div key={index} className="flex flex-col mb-4">
                    <div className="flex mb-2">
                      <select
                        value={voter.type}
                        onChange={(e) => handleVoterChange(index, e.target.value, 'type')}
                        className="p-2 border rounded-lg mr-2 w-1/4"
                      >
                        <option value="address">Wallet Address</option>
                        <option value="username">Username</option>
                      </select>
                      
                      {voter.type === 'username' ? (
                        <select
                          value={voter.identifier}
                          onChange={(e) => handleVoterChange(index, e.target.value, 'identifier')}
                          className="flex-grow p-2 border rounded-lg mr-2"
                        >
                          <option value="">Select a registered user</option>
                          {registeredUsers.map(user => (
                            <option key={user._id} value={user.username}>
                              {user.username} ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={voter.identifier}
                          onChange={(e) => handleVoterChange(index, e.target.value, 'identifier')}
                          className="flex-grow p-2 border rounded-lg mr-2"
                          placeholder="Enter wallet address"
                        />
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveVoter(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                        disabled={voters.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddVoter}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
                >
                  Add Voter
                </button>
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
                {loading ? 'Creating...' : 'Create Voting Session'}
              </button>
            </form>
          </div>
          
          {mySessions.length > 0 && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">My Hosted Sessions</h2>
              <div className="space-y-4">
                {mySessions.map((session) => (
                  <div key={session._id} className="border p-4 rounded-lg">
                    <h3 className="font-bold">{session.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{session.description}</p>
                    <div className="flex justify-between text-sm mb-3">
                      <span>{session.candidates.length} candidates</span>
                      <span>{session.voters.length} eligible voters</span>
                      <span>{session.votes?.length || 0} votes cast</span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSelectSession(session)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Manage Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HostVoting;