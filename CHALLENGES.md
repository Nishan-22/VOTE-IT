# Challenges and Solutions — VOTE·IT Development

Addressing development challenges during your defense is crucial; it demonstrates you understand the complexities of your system and can problem-solve.

## 1. Complex Database Validation
*   **Challenge:** Implementing multi-constraint election rules (e.g., ballot composition, gender diversity quotas) purely in the frontend was insecure, yet implementing them in the database was complex.
*   **Solution:** We moved the entire validation logic from the frontend into PostgreSQL using `validate_vote` triggers. This ensured that the database acted as the definitive "source of truth," rejecting any malformed request before a transaction was committed, regardless of its origin.
*   **Rationale:** Decouples security from the UI; the database remains compliant even if the client-side code is tampered with.

## 2. Maintaining Real-Time Data Consistency
*   **Challenge:** Ensuring multiple users viewing the `/results` page saw identical, up-to-the-millisecond tallies without excessive server load or manual refreshing.
*   **Solution:** We utilized Supabase’s built-in Realtime engine, which subscribes the client to database changes via WebSockets. This offloaded the complexity of manual state management and socket lifecycle handling.
*   **Rationale:** Provides an "instant" experience for users while reducing the need for constant polling, which preserves server resources.

## 3. Security vs. User Experience (Auth & Web3)
*   **Challenge:** Creating a secure "identity binding" process that didn't create a massive barrier to entry for non-technical users.
*   **Solution:** We designed a two-tiered identity flow: Supabase handles familiar email-based authentication (Whitelist/Registration), while the Web3 connection is integrated as a secondary "Proof of Humanity" step at the time of casting the ballot.
*   **Rationale:** Balances high-security requirements with the accessibility needs of a university-wide election.

## 4. Database Schema Evolution
*   **Challenge:** Evolving the schema (e.g., adding `image_url` or handling changing election requirements) without breaking existing data or triggers.
*   **Solution:** We adopted a migration-first workflow using Supabase Migrations, allowing us to version-control schema changes.
*   **Rationale:** Enables safe, incremental updates to validation logic and schema without risking data corruption, essential for an iterative development lifecycle.
