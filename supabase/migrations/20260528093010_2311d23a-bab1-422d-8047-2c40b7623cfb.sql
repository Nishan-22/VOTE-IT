
-- Enums
CREATE TYPE public.post_type AS ENUM ('president', 'secretary', 'member');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  batch_year int NOT NULL CHECK (batch_year BETWEEN 1 AND 4),
  gender public.gender_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Candidates
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  batch_year int NOT NULL CHECK (batch_year BETWEEN 1 AND 4),
  gender public.gender_type NOT NULL,
  post public.post_type NOT NULL,
  manifesto text NOT NULL,
  wallet_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post)
);
GRANT SELECT, INSERT, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates readable by authenticated" ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own candidacy" ON public.candidates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own candidacy" ON public.candidates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Validation: only 4th year can run for president
CREATE OR REPLACE FUNCTION public.validate_candidate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.post = 'president' AND NEW.batch_year <> 4 THEN
    RAISE EXCEPTION 'Only 4th-year students may register for president';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_candidate_trg
BEFORE INSERT OR UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.validate_candidate();

-- Votes
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  president_id uuid NOT NULL REFERENCES public.candidates(id),
  secretary_id uuid NOT NULL REFERENCES public.candidates(id),
  member_ids uuid[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes readable by authenticated" ON public.votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own vote" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);

-- Validation: all-or-nothing + exactly 7 members + at least 2 female + valid posts
CREATE OR REPLACE FUNCTION public.validate_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pres_post public.post_type;
  sec_post public.post_type;
  member_count int;
  female_count int;
  invalid_count int;
BEGIN
  SELECT post INTO pres_post FROM public.candidates WHERE id = NEW.president_id;
  IF pres_post <> 'president' THEN RAISE EXCEPTION 'Invalid president candidate'; END IF;

  SELECT post INTO sec_post FROM public.candidates WHERE id = NEW.secretary_id;
  IF sec_post <> 'secretary' THEN RAISE EXCEPTION 'Invalid secretary candidate'; END IF;

  IF array_length(NEW.member_ids, 1) <> 7 THEN
    RAISE EXCEPTION 'You must vote for exactly 7 members';
  END IF;

  IF (SELECT COUNT(DISTINCT m) FROM unnest(NEW.member_ids) m) <> 7 THEN
    RAISE EXCEPTION 'Member votes must be unique';
  END IF;

  SELECT COUNT(*) INTO invalid_count
  FROM unnest(NEW.member_ids) m
  WHERE NOT EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = m AND c.post = 'member');
  IF invalid_count > 0 THEN RAISE EXCEPTION 'All 7 selections must be valid member candidates'; END IF;

  SELECT COUNT(*) INTO female_count
  FROM public.candidates
  WHERE id = ANY(NEW.member_ids) AND gender = 'female';
  IF female_count < 2 THEN
    RAISE EXCEPTION 'At least 2 of the 7 member votes must be female candidates';
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_vote_trg
BEFORE INSERT ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.validate_vote();

-- Auto profile row on signup (uses metadata if provided)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, batch_year, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'batch_year')::int, 1),
    COALESCE((NEW.raw_user_meta_data->>'gender')::public.gender_type, 'other')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
