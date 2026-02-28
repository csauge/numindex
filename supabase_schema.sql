-- SQL Schema for Salvia

-- Resources Table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  category TEXT NOT NULL CHECK (category IN ('entreprise', 'association', 'article', 'podcast', 'outil', 'livre')),
  language TEXT NOT NULL CHECK (language IN ('fr', 'en')),
  image_url TEXT,
  metadata JSONB DEFAULT '{"tags": []}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Suggestions Table (User Contributions)
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{"tags": []}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Resource Policies
CREATE POLICY "Anyone can read resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Anyone can insert resources" ON resources FOR INSERT WITH CHECK (true); -- Note: Should be restricted in production

-- Suggestion Policies
CREATE POLICY "Anyone can submit suggestions" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can select suggestions" ON suggestions FOR SELECT USING (true);
CREATE POLICY "Anyone can update suggestions" ON suggestions FOR UPDATE USING (true); -- Note: Restricted to admin in production

