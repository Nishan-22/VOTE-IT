# Mock Candidates Seed Data (College Style)

Copy and run this entire script in your Supabase **SQL Editor** to populate your demo with student-style candidates.

```sql
-- 1. Whitelist Update
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

-- 2. Candidates Update
DELETE FROM public.candidates WHERE full_name IN (
  'Arjun Adhikari', 'Binita Poudel', 'Sita Ram', 'Kushal Mani', 
  'Priya Thapa', 'Rohan Gurung', 'Maya KC', 'Bibek Poudel', 
  'Anjali Rai', 'Sagar Sharma', 'Nisha Tamang', 'Kiran Bhatta', 
  'Deepika Joshi', 'Rahul Magar', 'Sujita Lama', 'Aaryan Khan', 
  'Suman Thapa', 'Ishwor Rai', 'Prakash Joshi'
);

INSERT INTO public.candidates (id, user_id, full_name, batch_year, gender, post, manifesto, image_url) VALUES
-- Presidents (2)
(gen_random_uuid(), gen_random_uuid(), 'Arjun Adhikari', 4, 'male', 'president', 'Experienced leader aiming to digitalize IT Club activities.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Binita Poudel', 4, 'female', 'president', 'Advocating for more industry-level workshops and seminars.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'),

-- Secretaries (2)
(gen_random_uuid(), gen_random_uuid(), 'Sita Ram', 3, 'female', 'secretary', 'Focusing on transparent communication and timely event updates.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Kushal Mani', 3, 'male', 'secretary', 'Efficient documentation and management is my priority.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'),

-- Members (15)
(gen_random_uuid(), gen_random_uuid(), 'Priya Thapa', 2, 'female', 'member', 'Passionate about organizing hackathons.', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Rohan Gurung', 1, 'male', 'member', 'Will bridge the gap between 1st year and seniors.', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Maya KC', 2, 'female', 'member', 'Working towards better resource sharing.', 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Bibek Poudel', 3, 'male', 'member', 'Active participation in all IT events.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Anjali Rai', 2, 'female', 'member', 'Will promote inclusivity in the club.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Sagar Sharma', 1, 'male', 'member', 'Tech enthusiast ready to serve.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Nisha Tamang', 4, 'female', 'member', 'Mentoring juniors for better career paths.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Kiran Bhatta', 3, 'male', 'member', 'Improving our lab facilities.', 'https://images.unsplash.com/photo-1547037579-f0fc020ac3be?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Deepika Joshi', 2, 'female', 'member', 'Advocating for female representation in tech.', 'https://images.unsplash.com/photo-1567532939604-b6c5b0ad2e01?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Rahul Magar', 1, 'male', 'member', 'Eager to learn and contribute.', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Sujita Lama', 3, 'female', 'member', 'Strengthening our IT community.', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Aaryan Khan', 2, 'male', 'member', 'Bringing innovative ideas to the committee.', 'https://images.unsplash.com/photo-1492562080023-ab3dbdf5bb3d?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Suman Thapa', 1, 'male', 'member', 'Committed to weekly coding challenges.', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Ishwor Rai', 3, 'male', 'member', 'Promoting open source culture.', 'https://images.unsplash.com/photo-1507591064344-4c6ad005b128?w=400&h=400&fit=crop'),
(gen_random_uuid(), gen_random_uuid(), 'Prakash Joshi', 2, 'male', 'member', 'Active volunteer for all tech fests.', 'https://images.unsplash.com/photo-1531750026848-8ada78f641c2?w=400&h=400&fit=crop')
ON CONFLICT DO NOTHING;
```
