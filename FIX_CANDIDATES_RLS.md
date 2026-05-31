# Fix Candidates Table RLS Error

Copy and run this SQL in your Supabase **SQL Editor** to allow candidates to submit their nominations.

```sql
-- Allow authenticated users to insert their own candidate profile
DROP POLICY IF EXISTS "Users insert own candidacy" ON public.candidates;

CREATE POLICY "Users insert own candidacy" ON public.candidates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also allow them to update/delete their own profile if needed
DROP POLICY IF EXISTS "Users update own candidacy" ON public.candidates;

CREATE POLICY "Users update own candidacy" ON public.candidates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
```
