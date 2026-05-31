# VOTE·IT — GU Vote Spark

Official election portal for the Gandaki University IT Club committee. This version is optimized for the **Midterm Defense**, featuring centralized admin control and wallet-bound identity verification.

## 🚀 Quick Start

```bash
bun install
bun run dev
```

### Environment Setup
Create a `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## 🛠 Tech Stack
- **Frontend:** React 19, TanStack Start, Tailwind CSS 4
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Web3:** MetaMask (Polygon Amoy) for verifiable identity binding
- **Security:** PostgreSQL triggers and Row Level Security (RLS)

## 🗳 Midterm Demo Features
- **Admin Dashboard:** Centralized control to manually **Open/Close** the election window.
- **Whitelist System:** Only pre-approved university emails can register and vote.
- **Candidate Gallery:** Visual grid of nominees with profile photos and manifestos.
- **Wallet-Bound Voting:** Users must connect a valid blockchain wallet to cast a ballot.
- **Structured Ballot:** Enforced rules (e.g., exactly 7 members, min. 2 female candidates).
- **Live Results:** Real-time tallying and visualization of votes.

## 📋 Database Schema
The system uses the following core tables:
- `eligible_voters`: The whitelist of allowed students.
- `profiles`: User profiles with roles (Admin/Student).
- `candidates`: Nominees with photos and manifestos.
- `votes`: Securely stored, one-time ballots.
- `election_settings`: Global toggle for the voting window.

## 👨‍💼 Admin Setup
The account `nishan.63222@gandakiuniversity.edu.np` is automatically granted Admin privileges.
- Go to `/admin` to toggle the election status.
- Use the **"Open Election"** button to start the voting process.

---

### 🚀 Midterm Demo Setup

Follow these steps exactly to get your database ready for the defense:

#### 1. Core Schema & Admin Setup
Copy and run the code from **`SUPABASE_SETUP.md`** first. This creates your tables and grants you Admin access.

#### 2. Fix Missing Image Column
If you see an error about `image_url`, run this command in your Supabase SQL Editor:
```sql
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS image_url text;
```

#### 3. Populate Mock Candidates
Copy and run this entire block to add 2 Presidents, 2 Secretaries, and 15 Members with photos:

```sql
-- A. Whitelist Students
INSERT INTO public.eligible_voters (full_name, email, student_id) VALUES
('Arjun Adhikari', 'arjun.demo@gandakiuniversity.edu.np', 'GU2023-101'),
('Sita Ram', 'sita.demo@gandakiuniversity.edu.np', 'GU2023-102'),
('Kushal Mani', 'kushal.demo@gandakiuniversity.edu.np', 'GU2023-103'),
('Priya Thapa', 'priya.demo@gandakiuniversity.edu.np', 'GU2023-104'),
('Rohan Gurung', 'rohan.demo@gandakiuniversity.edu.np', 'GU2023-105'),
('Maya KC', 'maya.demo@gandakiuniversity.edu.np', 'GU2023-106'),
('Bibek Poudel', 'bibek.demo@gandakiuniversity.edu.np', 'GU2023-107'),
('Anjali Rai', 'anjali.demo@gandakiuniversity.edu.np', 'GU2023-108'),
('Sagar Sharma', 'sagar.demo@gandakiuniversity.edu.np', 'GU2023-109'),
('Nisha Tamang', 'nisha.demo@gandakiuniversity.edu.np', 'GU2023-110'),
('Kiran Bhatta', 'kiran.demo@gandakiuniversity.edu.np', 'GU2023-111'),
('Deepika Joshi', 'deepika.demo@gandakiuniversity.edu.np', 'GU2023-112'),
('Rahul Magar', 'rahul.demo@gandakiuniversity.edu.np', 'GU2023-113'),
('Sujita Lama', 'sujita.demo@gandakiuniversity.edu.np', 'GU2023-114'),
('Aaryan Khan', 'aaryan.demo@gandakiuniversity.edu.np', 'GU2023-115'),
('Binita Poudel', 'binita.demo@gandakiuniversity.edu.np', 'GU2023-116'),
('Suman Thapa', 'suman.demo@gandakiuniversity.edu.np', 'GU2023-117'),
('Ishwor Rai', 'ishwor.demo@gandakiuniversity.edu.np', 'GU2023-118'),
('Prakash Joshi', 'prakash.demo@gandakiuniversity.edu.np', 'GU2023-119')
ON CONFLICT (email) DO NOTHING;

-- B. Clear and Add Candidates
DELETE FROM public.candidates WHERE full_name IN (
  'Arjun Adhikari', 'Binita Poudel', 'Sita Ram', 'Kushal Mani', 
  'Priya Thapa', 'Rohan Gurung', 'Maya KC', 'Bibek Poudel', 
  'Anjali Rai', 'Sagar Sharma', 'Nisha Tamang', 'Kiran Bhatta', 
  'Deepika Joshi', 'Rahul Magar', 'Sujita Lama', 'Aaryan Khan', 
  'Suman Thapa', 'Ishwor Rai', 'Prakash Joshi'
);

INSERT INTO public.candidates (id, user_id, full_name, batch_year, gender, post, manifesto, image_url) VALUES
(gen_random_uuid(), gen_random_uuid(), 'Arjun Adhikari', 4, 'male', 'president', 'Experienced leader aiming to digitalize IT Club activities.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Binita Poudel', 4, 'female', 'president', 'Advocating for more industry-level workshops and seminars.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Sita Ram', 3, 'female', 'secretary', 'Focusing on transparent communication and timely event updates.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Kushal Mani', 3, 'male', 'secretary', 'Efficient documentation and management is my priority.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Priya Thapa', 2, 'female', 'member', 'Passionate about organizing hackathons.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Rohan Gurung', 1, 'male', 'member', 'Will bridge the gap between 1st year and seniors.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Maya KC', 2, 'female', 'member', 'Working towards better resource sharing.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Bibek Poudel', 3, 'male', 'member', 'Active participation in all IT events.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Anjali Rai', 2, 'female', 'member', 'Will promote inclusivity in the club.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Sagar Sharma', 1, 'male', 'member', 'Tech enthusiast ready to serve.', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Nisha Tamang', 4, 'female', 'member', 'Mentoring juniors for better career paths.', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Kiran Bhatta', 3, 'male', 'member', 'Improving our lab facilities.', 'https://images.unsplash.com/photo-1547037579-f0fc020ac3be?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Deepika Joshi', 2, 'female', 'member', 'Advocating for female representation in tech.', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Rahul Magar', 1, 'male', 'member', 'Eager to learn and contribute.', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Sujita Lama', 3, 'female', 'member', 'Strengthening our IT community.', 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Aaryan Khan', 2, 'male', 'member', 'Bringing innovative ideas to the committee.', 'https://images.unsplash.com/photo-1492562080023-ab3dbdf5bb3d?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Suman Thapa', 1, 'male', 'member', 'Committed to weekly coding challenges.', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Ishwor Rai', 3, 'male', 'member', 'Promoting open source culture.', 'https://images.unsplash.com/photo-1507591064344-4c6ad005b128?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Prakash Joshi', 2, 'male', 'member', 'Active volunteer for all tech fests.', 'https://images.unsplash.com/photo-1531750026848-8ada78f641c2?w=400&h=400&fit=crop')
ON CONFLICT DO NOTHING;
```

## Architecture

```
Browser (React pages)
    │
    ├── AuthProvider  ──► Supabase Auth (email/password)
    ├── Web3Provider  ──► MetaMask (Polygon Amoy)
    └── supabase-js   ──► PostgreSQL + RLS + Triggers
                              │
                              └── Realtime ──► /results auto-refresh
```

There is no separate custom API server. The client uses Supabase with Row Level Security (RLS).

## Database

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase-managed accounts |
| `profiles` | Name, batch year (1–4), gender, `is_admin` |
| `eligible_voters` | Email whitelist for registration |
| `candidates` | Nominations by post |
| `votes` | One ballot per voter |

Schema and triggers: `supabase/migrations/`. Test whitelist rows are seeded in `20260529000000_eligible_voters.sql`. Manage voters via **/admin** or the Supabase table editor.

## Election rules

| Rule | Enforcement |
|------|-------------|
| Whitelisted email only | `login.jsx` + `eligible_voters` |
| President: 4th year only | `validate_candidate` trigger + register UI |
| Ballot: 1 president, 1 secretary, 7 members | `validate_vote` trigger + `/vote` UI |
| ≥ 2 female among 7 members | `validate_vote` trigger + `/vote` UI |
| One vote per user | `votes.voter_id` UNIQUE |
| One candidacy per post per user | `UNIQUE(user_id, post)` |

UI guides the user; PostgreSQL triggers reject invalid inserts even if the client is tampered with.

## User flows

### Admin — whitelist

```
Admin (is_admin) → /admin → INSERT/DELETE eligible_voters
```

Files: `src/routes/admin.jsx`

### Student — sign up

```
/login (Register) → check eligible_voters → signUp → profiles row via trigger → /vote
```

Files: `src/routes/login.jsx`, `src/lib/auth.jsx`

### Student — nomination

```
/register → INSERT candidates (manifesto, post)
```

Files: `src/routes/register.jsx`

### Student — vote

```
/vote → load candidates → select pres/sec/7 members → connect wallet → INSERT votes → validate_vote trigger → /results
```

Files: `src/routes/vote.jsx`, `src/components/CandidateCard.jsx`, `src/components/WalletConnect.jsx`

Wallet is required in the UI; on-chain `castBallot` is Phase 2. Votes are stored in Supabase (`tx_hash` columns reserved).

### Results

```
/results → aggregate vote counts → Realtime on votes → refresh tally
```

Files: `src/routes/results.jsx`

## Source map

| Feature | Location |
|---------|----------|
| App shell | `src/routes/__root.tsx` |
| Navigation | `src/components/SiteHeader.jsx` |
| Auth | `src/lib/auth.jsx` |
| Supabase client | `src/integrations/supabase/client.ts` |
| Web3 | `src/lib/web3.jsx`, `src/components/WalletConnect.jsx` |
| Theme | `src/styles.css` |
| Smart contract | `contracts/BallotChain.sol` |

---

## Viva preparation

### One-line summary

GU Vote Spark is a web election system for the GU IT Club: whitelist registration, candidate nominations, one structured ballot per student (President + Secretary + 7 Members with at least 2 female members), PostgreSQL-enforced rules, and live results via Supabase Realtime.

### Key concepts

**AuthProvider** (`src/lib/auth.jsx`): loads session and `profiles` row; exposes `useAuth()`.

**RLS**: policies such as `auth.uid() = voter_id` on vote inserts.

**Triggers vs UI**: React gives instant feedback; triggers are the source of truth.

**TanStack Query**: caches candidates/votes/tally; invalidated on Realtime events.

### Common questions

**Why Supabase?** Integrated auth, database, and realtime; RLS without a custom API.

**Double voting?** `votes.voter_id` UNIQUE; UI checks existing vote.

**Two female members?** `validate_vote` counts female candidates in `member_ids`.

**MetaMask?** Wallet on Polygon Amoy for identity binding; full chain anchoring is Phase 2.

**BallotChain.sol?** Stores a keccak256 ballot hash per address for independent verification.

**Bypass frontend?** JWT + RLS + triggers still apply.

**Live results?** Realtime subscription on `votes` invalidates the tally query.

**Who uses /admin?** Users with `profiles.is_admin = true`.

### Demo walkthrough (~2 min)

1. Home — seats and rules.
2. Login — whitelist check.
3. Candidates — nominees by post.
4. Vote — compliance progress and submit.
5. Results — bars and auto-refresh.
6. Admin — whitelist (admin account).
7. Supabase migrations — `validate_vote` trigger.

### Mental model

```
Whitelist → Register → Profile
              ↓
       Nominate (optional)
              ↓
       Vote once (DB rules)
              ↓
       Live results
```
