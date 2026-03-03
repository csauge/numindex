-- SQL Schema for Salvia 🌿

-- 0. Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 1. Resources Table (Public Catalog)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  -- Categories aligned with src/utils/categories.ts
  category TEXT NOT NULL CHECK (category IN (
    'entreprise', 'association', 'cooperative', 'public', 'personne', 
    'article', 'livre', 'podcast', 'video', 'infographie', 
    'referentiel', 'logiciel', 'jeu', 'formation', 'evenement', 'autre'
  )),
  language TEXT NOT NULL CHECK (language IN ('fr', 'en')),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  related_ids UUID[] DEFAULT '{}', -- UUIDs of related entities (co-authors, partners, etc.)
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible storage for category-specific data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for resources
CREATE TRIGGER update_resources_updated_at 
BEFORE UPDATE ON resources 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Suggestions Table (Moderation Queue)
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Resource data
  title TEXT,
  description TEXT,
  link TEXT,
  category TEXT CHECK (category IN (
    'entreprise', 'association', 'cooperative', 'public', 'personne', 
    'article', 'livre', 'podcast', 'video', 'infographie', 
    'referentiel', 'logiciel', 'jeu', 'formation', 'evenement', 'autre'
  )),
  language TEXT CHECK (language IN ('fr', 'en')),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  related_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Workflow data
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  action TEXT DEFAULT 'create' CHECK (action IN ('create', 'update', 'delete')),
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  reason TEXT, -- Reason for deletion or modification
  
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_resources_tags ON resources USING GIN (tags);
CREATE INDEX idx_resources_related_ids ON resources USING GIN (related_ids);
CREATE INDEX idx_suggestions_resource_id ON suggestions(resource_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_action ON suggestions(action);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Resources
-- Anyone can see approved resources
CREATE POLICY "Anyone can read resources" ON resources 
FOR SELECT USING (true);

-- Admin (or Anon Key in this simple setup) can manage resources
CREATE POLICY "Anyone can insert resources" ON resources 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update resources" ON resources 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete resources" ON resources 
FOR DELETE USING (true);

-- 4. RLS Policies for Suggestions
-- Anyone can submit a suggestion
CREATE POLICY "Anyone can submit suggestions" ON suggestions 
FOR INSERT WITH CHECK (true);

-- Anyone can see suggestions (needed for the admin moderation list)
CREATE POLICY "Anyone can select suggestions" ON suggestions 
FOR SELECT USING (true);

-- Admin can update status (pending -> approved/rejected)
CREATE POLICY "Anyone can update suggestions" ON suggestions 
FOR UPDATE USING (true);
