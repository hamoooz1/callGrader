-- Create a demo company
INSERT INTO companies (name, primary_contact_email)
VALUES ('DemoCo', 'admin@democo.com')
RETURNING id;
-- Suppose returned id is stored; for clarity we can use CTEs:

WITH comp AS (
  INSERT INTO companies (name, primary_contact_email)
  VALUES ('DemoCo', 'admin@democo.com')
  RETURNING id
),
agent AS (
  INSERT INTO users (company_id, email, name)
  SELECT id, 'bob.agent@democo.com', 'Bob Agent' FROM comp
  RETURNING id
),
reviewer AS (
  INSERT INTO users (company_id, email, name)
  SELECT id, 'alice.reviewer@democo.com', 'Alice Reviewer' FROM comp
  RETURNING id
),
_role_assign AS (
  -- assign roles
  INSERT INTO user_roles (user_id, role)
  SELECT id, 'agent'::user_role FROM agent
  UNION ALL
  SELECT id, 'reviewer'::user_role FROM reviewer
),
rubric AS (
  INSERT INTO rubrics (company_id, name, description, created_by)
  SELECT c.id, 'Basic Sales Call', 'Check discovery and closing', r.id
  FROM comp c, reviewer r
  RETURNING id
),
q1 AS (
  INSERT INTO rubric_questions (rubric_id, prompt, type, weight, mandatory, order_index)
  SELECT id, 'Did the rep ask discovery questions?', 'boolean'::question_type, 2, true, 0
  FROM rubric
  RETURNING id
),
q2 AS (
  INSERT INTO rubric_questions (rubric_id, prompt, type, weight, mandatory, expected_keywords, order_index)
  SELECT id, 'Was the value proposition clearly stated?', 'keyword_presence'::question_type, 3, true, ARRAY['value proposition','benefit','ROI'], 1
  FROM rubric
  RETURNING id
),
callrec AS (
  INSERT INTO calls (company_id, agent_id, audio_format, duration_seconds, transcript_source, status)
  SELECT c.id, a.id, 'mp3', 180, 'upload'::transcript_source, 'ready'::call_status
  FROM comp c, agent a
  RETURNING id
),
trans AS (
  INSERT INTO transcripts (call_id, content, format, version, source)
  SELECT id,
    'Agent: Hello, I wanted to talk about the ROI of our product. Customer: Sure, tell me more.',
    'plain', 1, 'upload'::transcript_source
  FROM callrec
  RETURNING call_id
),
evaluation AS (
  INSERT INTO evaluations (call_id, reviewer_id, rubric_id, overall_score, passed, missing_mandatory_question_ids, comments)
  SELECT c.id, r.id, rb.id, 83.33, true, ARRAY[]::UUID[], 'Good value prop; discovery covered.'
  FROM callrec c, reviewer r, rubric rb
  RETURNING id
),
ans1 AS (
  INSERT INTO evaluation_answers (evaluation_id, question_id, answer_boolean, normalized_score)
  SELECT e.id, q1.id, true, 1.0
  FROM evaluation e, q1
),
ans2 AS (
  INSERT INTO evaluation_answers (evaluation_id, question_id, matched_keywords, normalized_score)
  SELECT e.id, q2.id, ARRAY['value proposition'], 1.0
  FROM evaluation e, q2
)
SELECT 'seed complete';
