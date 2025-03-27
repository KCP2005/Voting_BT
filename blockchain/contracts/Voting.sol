// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    address public admin;
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    mapping(address => bool) public hasVoted;
    uint public candidatesCount;
    bool public votingClosed;

    event CandidateAdded(uint candidateId, string name);
    event VoterRegistered(address voter);
    event Voted(address voter, uint candidateId);
    event VotingClosed();

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier votingOpen() {
        require(!votingClosed, "Voting is closed");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addCandidate(string memory _name) public onlyAdmin votingOpen {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function registerVoter(address _voter) public onlyAdmin votingOpen {
        require(!voters[_voter], "Voter already registered");
        voters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    function vote(uint _candidateId) public votingOpen {
        require(voters[msg.sender], "You are not registered to vote");
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }

    function getCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidatesCount);
        for (uint i = 1; i <= candidatesCount; i++) {
            allCandidates[i-1] = candidates[i];
        }
        return allCandidates;
    }

    function closeVoting() public onlyAdmin {
        votingClosed = true;
        emit VotingClosed();
    }
}