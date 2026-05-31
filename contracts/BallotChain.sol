// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BallotChain — Gandaki University IT Club election anchor
/// @notice Each voter address may anchor exactly one ballot hash on-chain.
///         The hash is computed off-chain as keccak256 of the canonical
///         ballot payload (president_id, secretary_id, sorted member_ids,
///         voter_id). This contract proves the ballot existed and was
///         immutable from the moment of submission.
contract BallotChain {
    struct Ballot {
        bytes32 ballotHash;
        uint64  timestamp;
        uint64  blockNumber;
    }

    string  public electionName;
    address public immutable admin;
    uint64  public immutable openAt;
    uint64  public immutable closeAt;

    mapping(address => Ballot) public ballots;
    address[] public voters;

    event BallotCast(
        address indexed voter,
        bytes32 indexed ballotHash,
        uint256 timestamp,
        uint256 indexed serial
    );

    error AlreadyVoted();
    error VotingClosed();
    error EmptyHash();

    constructor(string memory _electionName, uint64 _openAt, uint64 _closeAt) {
        admin         = msg.sender;
        electionName  = _electionName;
        openAt        = _openAt;
        closeAt       = _closeAt;
    }

    /// @notice Anchor a ballot hash. One per address, irreversible.
    function castBallot(bytes32 ballotHash) external {
        if (ballotHash == bytes32(0))                       revert EmptyHash();
        if (ballots[msg.sender].ballotHash != bytes32(0))   revert AlreadyVoted();
        if (block.timestamp < openAt || block.timestamp > closeAt) revert VotingClosed();

        ballots[msg.sender] = Ballot({
            ballotHash:  ballotHash,
            timestamp:   uint64(block.timestamp),
            blockNumber: uint64(block.number)
        });
        voters.push(msg.sender);

        emit BallotCast(msg.sender, ballotHash, block.timestamp, voters.length);
    }

    function totalBallots() external view returns (uint256) {
        return voters.length;
    }

    function hasVoted(address voter) external view returns (bool) {
        return ballots[voter].ballotHash != bytes32(0);
    }

    function verify(address voter, bytes32 ballotHash) external view returns (bool) {
        return ballots[voter].ballotHash == ballotHash;
    }
}