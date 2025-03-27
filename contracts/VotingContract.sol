// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingContract {
    struct Candidate {
        string name;
        uint256 voteCount;
        bool exists;
    }
    
    struct Voter {
        bool hasVoted;
        uint256 votedFor;
        bool isEligible;
    }
    
    struct VotingSession {
        uint256 id;
        address host;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 resultTime;
        bool active;
        string[] candidateNames;
        mapping(uint256 => Candidate) candidates;
        mapping(address => Voter) voters;
        address[] voterAddresses;
    }
    
    uint256 private sessionCounter;
    mapping(uint256 => VotingSession) public sessions;
    mapping(address => uint256[]) public userSessions;
    
    event SessionCreated(uint256 sessionId, address host, string name);
    event VoteCast(uint256 sessionId, address voter, uint256 candidateId);
    event VoterAdded(uint256 sessionId, address voter);
    event CandidateAdded(uint256 sessionId, string name);
    event SessionClosed(uint256 sessionId);
    
    function createVotingSession(
        string memory _name,
        string memory _description,
        string[] memory _candidates,
        address[] memory _voters,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _resultTime
    ) public returns (uint256) {
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        require(_resultTime >= _endTime, "Result time must be after end time");
        require(_candidates.length > 0, "Must have at least one candidate");
        
        uint256 sessionId = sessionCounter++;
        VotingSession storage newSession = sessions[sessionId];
        newSession.id = sessionId;
        newSession.host = msg.sender;
        newSession.name = _name;
        newSession.description = _description;
        newSession.startTime = _startTime;
        newSession.endTime = _endTime;
        newSession.resultTime = _resultTime;
        newSession.active = true;
        newSession.candidateNames = _candidates;
        
        for (uint256 i = 0; i < _candidates.length; i++) {
            newSession.candidates[i] = Candidate({
                name: _candidates[i],
                voteCount: 0,
                exists: true
            });
        }
        
        for (uint256 i = 0; i < _voters.length; i++) {
            newSession.voters[_voters[i]] = Voter({
                hasVoted: false,
                votedFor: 0,
                isEligible: true
            });
            newSession.voterAddresses.push(_voters[i]);
            emit VoterAdded(sessionId, _voters[i]);
        }
        
        userSessions[msg.sender].push(sessionId);
        emit SessionCreated(sessionId, msg.sender, _name);
        
        return sessionId;
    }
    
    function addVoter(uint256 _sessionId, address _voter) public {
        VotingSession storage session = sessions[_sessionId];
        require(session.host == msg.sender, "Only host can add voters");
        require(session.active, "Session is not active");
        require(!session.voters[_voter].isEligible, "Voter already eligible");
        
        session.voters[_voter] = Voter({
            hasVoted: false,
            votedFor: 0,
            isEligible: true
        });
        session.voterAddresses.push(_voter);
        
        emit VoterAdded(_sessionId, _voter);
    }
    
    function castVote(uint256 _sessionId, uint256 _candidateId) public {
        VotingSession storage session = sessions[_sessionId];
        require(session.active, "Session is not active");
        require(block.timestamp >= session.startTime, "Voting has not started yet");
        require(block.timestamp <= session.endTime, "Voting has ended");
        require(session.voters[msg.sender].isEligible, "Not eligible to vote");
        require(!session.voters[msg.sender].hasVoted, "Already voted");
        require(session.candidates[_candidateId].exists, "Candidate does not exist");
        
        session.voters[msg.sender].hasVoted = true;
        session.voters[msg.sender].votedFor = _candidateId;
        session.candidates[_candidateId].voteCount++;
        
        emit VoteCast(_sessionId, msg.sender, _candidateId);
    }
    
    function closeSession(uint256 _sessionId) public {
        VotingSession storage session = sessions[_sessionId];
        require(session.host == msg.sender, "Only host can close session");
        require(session.active, "Session is already closed");
        
        session.active = false;
        emit SessionClosed(_sessionId);
    }
    
    function getSessionDetails(uint256 _sessionId) public view returns (
        address host,
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 resultTime,
        bool active,
        string[] memory candidateNames,
        uint256 voterCount
    ) {
        VotingSession storage session = sessions[_sessionId];
        return (
            session.host,
            session.name,
            session.description,
            session.startTime,
            session.endTime,
            session.resultTime,
            session.active,
            session.candidateNames,
            session.voterAddresses.length
        );
    }
    
    function getCandidateVotes(uint256 _sessionId, uint256 _candidateId) public view returns (uint256) {
        return sessions[_sessionId].candidates[_candidateId].voteCount;
    }
    
    function getHostSessions() public view returns (uint256[] memory) {
        return userSessions[msg.sender];
    }
    
    function hasVoted(uint256 _sessionId, address _voter) public view returns (bool) {
        return sessions[_sessionId].voters[_voter].hasVoted;
    }
    
    function isEligibleVoter(uint256 _sessionId, address _voter) public view returns (bool) {
        return sessions[_sessionId].voters[_voter].isEligible;
    }
}