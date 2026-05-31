# VOTE·IT Midterm Defense — Cheat Sheet

### 1. The Narrative (The Story)
*   **The Problem:** Elections need transparency, accessibility, and anti-tamper security.
*   **The Solution:** React + Supabase (Auth, DB, Realtime) + Web3 Identity.
*   **The "Killer Feature":** PostgreSQL-enforced business logic (triggers) that guarantee election rules even if the frontend is bypassed.

### 2. The Demo (The "Golden Path")
1.  **Admin:** Toggle election to "Open" (shows reactivity).
2.  **Student:** Log in (whitelist check) → Select ballot (diversity quota validation) → Connect Wallet.
3.  **Real-time:** Show `/results` updating instantly via Supabase WebSockets.

### 3. Technical Pillars (The "Defense")
*   **Database as Source of Truth:** `validate_vote` triggers perform server-side rule enforcement (composition + gender quotas).
*   **RLS (Firewall):** Row Level Security restricts user data access and prevents unauthorized mutations.
*   **Identity Binding:** MetaMask acts as a cryptographic anchor ("Proof of Humanity") for each voter.

### 4. Q&A (Ready-to-use Answers)
*   **"Bypass UI?":** "Database triggers act as the final gatekeeper, rejecting invalid transactions before they commit."
*   **"Why Supabase?":** "Integrated auth, DB, RLS, and realtime sync; reduces complexity, maximizes security."
*   **"Double-voting?":** "Unique `voter_id` constraint + RLS ensures strictly one vote per user."
*   **"Hardest part?":** "Moving complex business logic into database-level triggers to ensure security without sacrificing UI responsiveness."
