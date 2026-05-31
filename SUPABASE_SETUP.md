# Supabase Database Setup

Copy and run the following SQL code in your Supabase **SQL Editor** to set up the database for the midterm demo. You can run all of this in one go.

```sql
-- ==========================================
-- STEP 1: CORE SCHEMA
-- ==========================================

-- Enums
CREATE TYPE public.post_type AS ENUM ('president', 'secretary', 'member');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  batch_year int NOT NULL CHECK (batch_year BETWEEN 1 AND 4),
  gender public.gender_type NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Candidates
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  batch_year int NOT NULL CHECK (batch_year BETWEEN 1 AND 4),
  gender public.gender_type NOT NULL,
  post public.post_type NOT NULL,
  manifesto text NOT NULL,
  image_url text,
  wallet_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post)
);

-- Votes
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  president_id uuid NOT NULL REFERENCES public.candidates(id),
  secretary_id uuid NOT NULL REFERENCES public.candidates(id),
  member_ids uuid[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Eligible Voters Whitelist
CREATE TABLE public.eligible_voters (
  email text PRIMARY KEY,
  full_name text NOT NULL,
  student_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligible_voters ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Anyone can read eligible voters" ON public.eligible_voters FOR SELECT USING (true);

-- ==========================================
-- STEP 2: AUTOMATION & PERMISSIONS
-- ==========================================

-- Auto profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, batch_year, gender, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'batch_year')::int, 1),
    COALESCE((NEW.raw_user_meta_data->>'gender')::public.gender_type, 'other'),
    CASE WHEN NEW.email = 'nishan.63222@gandakiuniversity.edu.np' THEN true ELSE false END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT SELECT ON public.eligible_voters TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.candidates TO authenticated;
GRANT SELECT, INSERT ON public.votes TO authenticated;

-- ==========================================
-- STEP 3: MIDTERM DEMO UPDATES
-- ==========================================

-- 1. Election Settings Table
CREATE TABLE IF NOT EXISTS public.election_settings (
    id int PRIMARY KEY DEFAULT 1,
    is_open boolean NOT NULL DEFAULT false,
    CONSTRAINT one_row CHECK (id = 1)
);

INSERT INTO public.election_settings (id, is_open) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- 2. Add All Eligible Voters to Whitelist (Total: 30)
INSERT INTO public.eligible_voters (full_name, email, student_id) VALUES
-- Admin
('Nishan Paudel', 'nishan.63222@gandakiuniversity.edu.np', 'GU2023-ADMIN'),

-- Original Students
('Aarav Sharma', 'aarav.sharma@gandakiuniversity.edu.np', 'GU2023-001'),
('Bina Thapa', 'bina.thapa@gandakiuniversity.edu.np', 'GU2023-002'),
('Chirag Gurung', 'chirag.gurung@gandakiuniversity.edu.np', 'GU2023-003'),
('Deepa Karki', 'deepa.karki@gandakiuniversity.edu.np', 'GU2023-004'),
('Eshan Bhatta', 'eshan.bhatta@gandakiuniversity.edu.np', 'GU2023-005'),
('Fiza Khan', 'fiza.khan@gandakiuniversity.edu.np', 'GU2023-006'),
('Ganesh Poudel', 'ganesh.poudel@gandakiuniversity.edu.np', 'GU2023-007'),
('Hina Joshi', 'hina.joshi@gandakiuniversity.edu.np', 'GU2023-008'),
('Ishwor Rai', 'ishwor.rai@gandakiuniversity.edu.np', 'GU2023-009'),
('Juna Shrestha', 'juna.shrestha@gandakiuniversity.edu.np', 'GU2023-010'),

-- Mock Candidate Profiles
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
('Ishwor Rai Demo', 'ishwor.demo@gandakiuniversity.edu.np', 'GU2023-118'),
('Prakash Joshi', 'prakash.demo@gandakiuniversity.edu.np', 'GU2023-119')
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, student_id = EXCLUDED.student_id;

-- 3. RLS for election_settings
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read election settings" ON public.election_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update election settings" ON public.election_settings FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 4. Grant permissions
GRANT SELECT ON public.election_settings TO authenticated, anon;
GRANT UPDATE ON public.election_settings TO authenticated;
```
