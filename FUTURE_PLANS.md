# Future Roadmap — VOTE·IT Evolution

The midterm demo provides a robust foundation for secure, authenticated voting. Our roadmap focuses on transitioning from a "Proof of Concept" to a "High-Integrity Production System."

## 1. Full Blockchain Integration (Phase 2)
*   **On-Chain Anchoring:** Move from storing ballot metadata in Supabase to anchoring a `keccak256` hash of every ballot on the Polygon network. This ensures that the election data is immutable and independently verifiable.
*   **Smart Contract Auditing:** Complete development and audit of `BallotChain.sol` to handle automated vote tallying directly on-chain.

## 2. Advanced Security & Auditability
*   **Zero-Knowledge Proofs (ZKP):** Explore ZK-proofs to allow users to verify their vote was counted correctly without revealing *who* they voted for, enhancing voter privacy.
*   **Independent Audit Portal:** Create a read-only portal where any participant can input their ballot hash to confirm its presence in the finalized blockchain record.

## 3. Scale & Feature Expansion
*   **Multi-Election Support:** Refactor the schema to support concurrent, distinct elections (e.g., Club Committee, Class Representative, Event Polling) with customizable rule sets.
*   **Optimized Real-time Aggregation:** Move from client-side tallying to server-side aggregation for larger datasets (thousands of voters) to maintain sub-second performance.

## 4. Accessibility & UI Enhancements
*   **Multi-Language Support:** Expand the interface to support local languages for broader inclusivity.
*   **Mobile-First Optimization:** Further optimize the voting ballot for low-end mobile devices to ensure that students with limited hardware can still participate seamlessly.

---

### Pro-tip for your Defense:
If asked, *"Where does this go from here?"*, pivot to this roadmap:
*   "This midterm defense focuses on **integrity and rule-based validation**. Phase 2 focuses on **immutability**, where we will transition from anchoring metadata in the database to hashing ballots directly on the blockchain."
