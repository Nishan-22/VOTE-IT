-- Midterm updates: Decouple smart contract and setup Nishan as Admin

-- 1. Election Settings Table
CREATE TABLE IF NOT EXISTS public.election_settings (
    id int PRIMARY KEY DEFAULT 1,
    is_open boolean NOT NULL DEFAULT false,
    CONSTRAINT one_row CHECK (id = 1)
);

-- Seed initial settings
INSERT INTO public.election_settings (id, is_open) 
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- RLS for election_settings
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read election settings" ON public.election_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update election settings" ON public.election_settings FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 2. Add Nishan Paudel to Whitelist
INSERT INTO public.eligible_voters (full_name, email, student_id)
VALUES ('Nishan Paudel', 'nishan.63222@gandakiuniversity.edu.np', 'GU2023-ADMIN')
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, student_id = EXCLUDED.student_id;

-- 3. Update handle_new_user to grant admin to Nishan
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
  ON CONFLICT (id) DO UPDATE SET
    is_admin = EXCLUDED.is_admin OR profiles.is_admin;
  RETURN NEW;
END;
$$;

-- Ensure existing profile for Nishan is admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'nishan.63222@gandakiuniversity.edu.np'
);

-- 4. Update validate_vote to check election_settings.is_open
CREATE OR REPLACE FUNCTION public.validate_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pres_post public.post_type;
  sec_post public.post_type;
  member_count int;
  female_count int;
  invalid_count int;
  is_election_open boolean;
BEGIN
  -- Check if election is open
  SELECT is_open INTO is_election_open FROM public.election_settings WHERE id = 1;
  IF NOT is_election_open THEN
    RAISE EXCEPTION 'Voting is currently closed by the administrator';
  END IF;

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

-- Grant permissions
GRANT SELECT ON public.election_settings TO authenticated, anon;
GRANT UPDATE ON public.election_settings TO authenticated;
