-- enable needed extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'reviewer', 'supervisor', 'agent');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('boolean', 'scale', 'multiple_choice', 'text', 'keyword_presence');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transcript_source') THEN
    CREATE TYPE transcript_source AS ENUM ('upload', 'transcribe');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status') THEN
    CREATE TYPE call_status AS ENUM ('pending', 'transcribing', 'ready', 'reviewed', 'archived');
  END IF;
END
$$;

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  primary_contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  external_auth_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);

-- User roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Rubrics
CREATE TABLE IF NOT EXISTS rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  base_rubric_id UUID REFERENCES rubrics(id),
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

-- Rubric questions
CREATE TABLE IF NOT EXISTS rubric_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type question_type NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  mandatory BOOLEAN DEFAULT FALSE,
  expected_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  order_index INT NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Question options (for multiple choice)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES rubric_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calls
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id),
  external_call_id TEXT,
  audio_s3_key TEXT,
  audio_format TEXT,
  duration_seconds INT,
  transcript_source transcript_source,
  status call_status NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transcripts (versioned)
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  content TEXT,
  raw_json JSONB,
  format TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source transcript_source NOT NULL,
  search_vector tsvector
);

-- Trigger function to keep search_vector updated
CREATE FUNCTION transcripts_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON transcripts;
CREATE TRIGGER tsvectorupdate
  BEFORE INSERT OR UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION transcripts_tsvector_trigger();

-- Call metrics
CREATE TABLE IF NOT EXISTS call_metrics (
  call_id UUID PRIMARY KEY REFERENCES calls(id) ON DELETE CASCADE,
  talk_listen_ratio NUMERIC,
  speech_rate NUMERIC,
  filler_count INT,
  sentiment_overall NUMERIC,
  keyword_matches JSONB,
  additional_metrics JSONB,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rubric_id UUID NOT NULL REFERENCES rubrics(id),
  overall_score NUMERIC,
  passed BOOLEAN,
  missing_mandatory_question_ids UUID[] DEFAULT ARRAY[]::UUID[],
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluation answers
CREATE TABLE IF NOT EXISTS evaluation_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES rubric_questions(id),
  answer_boolean BOOLEAN,
  answer_scale INT,
  answer_text TEXT,
  matched_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  normalized_score NUMERIC,
  override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Selected options for multiple choice in answers
CREATE TABLE IF NOT EXISTS evaluation_answer_options (
  evaluation_answer_id UUID NOT NULL REFERENCES evaluation_answers(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
  PRIMARY KEY (evaluation_answer_id, option_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calls_company ON calls(company_id);
CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_call ON evaluations(call_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_reviewer ON evaluations(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_company ON rubrics(company_id);
CREATE INDEX IF NOT EXISTS idx_rubric_questions_rubric ON rubric_questions(rubric_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_call ON transcripts(call_id);
CREATE INDEX IF NOT EXISTS transcripts_search_idx ON transcripts USING GIN (search_vector);
