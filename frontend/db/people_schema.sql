-- Schema for People module (PostgreSQL)
-- Assumption: PostgreSQL 13+ with pgcrypto extension for UUID

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core people table
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar TEXT,
  full_name TEXT NOT NULL,
  social_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  gender TEXT,
  marital_status TEXT,
  birth_date DATE,
  nationality TEXT,
  cpf TEXT,
  rg TEXT,
  nis TEXT,
  document_front TEXT,
  document_back TEXT,
  notes TEXT,
  profile_summary TEXT,
  favorite_color TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  label TEXT,
  zip TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Groups and join table (N:N)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS people_groups (
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  joined_at DATE,
  PRIMARY KEY (person_id, group_id)
);

-- Attendances
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  staff_name TEXT,
  notes_html TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Diaries
CREATE TABLE IF NOT EXISTS diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  date DATE NOT NULL,
  notes_html TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Occurrences
CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  date DATE NOT NULL,
  summary TEXT,
  initial_report_html TEXT,
  progress_notes_html TEXT,
  resolution_html TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS occurrence_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  description TEXT NOT NULL
);

-- Presences
CREATE TABLE IF NOT EXISTS presences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cycles
CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Formations
CREATE TABLE IF NOT EXISTS formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  course TEXT NOT NULL,
  level TEXT,
  status TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- School histories
CREATE TABLE IF NOT EXISTS school_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  school TEXT NOT NULL,
  grade TEXT,
  shift TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Income profiles
CREATE TABLE IF NOT EXISTS income_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  income NUMERIC(12,2) DEFAULT 0,
  income_range_min NUMERIC(12,2),
  income_range_max NUMERIC(12,2),
  other_income NUMERIC(12,2) DEFAULT 0,
  benefits TEXT[],
  employment_status TEXT,
  employment_start DATE,
  employment_end DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Family members
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  lives_together BOOLEAN DEFAULT FALSE,
  contributes_income BOOLEAN DEFAULT FALSE,
  income NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Family summary (optional, can be derived)
CREATE TABLE IF NOT EXISTS family_summaries (
  person_id UUID PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  household_members INTEGER DEFAULT 0,
  dependents INTEGER DEFAULT 0,
  dependent_age_min INTEGER,
  dependent_age_max INTEGER
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  summary TEXT,
  notes_html TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  notes_html TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_contacts_person_id ON contacts(person_id);
CREATE INDEX IF NOT EXISTS idx_addresses_person_id ON addresses(person_id);
CREATE INDEX IF NOT EXISTS idx_attendances_person_id ON attendances(person_id);
CREATE INDEX IF NOT EXISTS idx_diaries_person_id ON diaries(person_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_person_id ON occurrences(person_id);
CREATE INDEX IF NOT EXISTS idx_presences_person_id ON presences(person_id);
CREATE INDEX IF NOT EXISTS idx_cycles_person_id ON cycles(person_id);
CREATE INDEX IF NOT EXISTS idx_formations_person_id ON formations(person_id);
CREATE INDEX IF NOT EXISTS idx_school_histories_person_id ON school_histories(person_id);
CREATE INDEX IF NOT EXISTS idx_income_profiles_person_id ON income_profiles(person_id);
CREATE INDEX IF NOT EXISTS idx_family_members_person_id ON family_members(person_id);
CREATE INDEX IF NOT EXISTS idx_assessments_person_id ON assessments(person_id);
CREATE INDEX IF NOT EXISTS idx_activities_person_id ON activities(person_id);
