const express = require('express');
const router = express.Router();
const { Client } = require('pg');
const { scoreEvaluation } = require('../services/scoring');
const { v4: uuidv4 } = require('uuid');

// POST /api/calls/:callId/evaluations
router.post('/calls/:callId/evaluations', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { callId } = req.params;
  const { reviewer_id, rubric_id, answers = {}, comments = '' } = req.body;

  if (!reviewer_id || !rubric_id) {
    return res.status(400).json({ error: 'Missing reviewer_id or rubric_id in request body' });
  }

  try {
    await client.query('BEGIN');

    const rubricRes = await client.query(
      `SELECT id, prompt, type::text, weight, mandatory, expected_keywords
       FROM rubric_questions WHERE rubric_id = $1`,
      [rubric_id]
    );
    const questions = rubricRes.rows;

    const transcriptRes = await client.query(
      `SELECT content FROM transcripts WHERE call_id = $1 ORDER BY version DESC LIMIT 1`,
      [callId]
    );
    const transcript = transcriptRes.rows[0]?.content || '';

    const scoring = scoreEvaluation(questions, answers, transcript);

    const evaluationId = uuidv4();
    await client.query(
      `INSERT INTO evaluations (
        id, call_id, reviewer_id, rubric_id, overall_score, passed, missing_mandatory_question_ids, comments
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        evaluationId,
        callId,
        reviewer_id,
        rubric_id,
        scoring.overallScore,
        scoring.passed,
        scoring.missingMandatory,
        comments
      ]
    );

    for (const q of scoring.perQuestion) {
      await client.query(
        `INSERT INTO evaluation_answers (
          id, evaluation_id, question_id, normalized_score, answer_boolean, answer_scale, answer_text, matched_keywords
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          uuidv4(),
          evaluationId,
          q.question_id,
          q.normalized_score,
          q.answer?.answer_boolean ?? null,
          q.answer?.answer_scale ?? null,
          q.answer?.answer_text ?? null,
          q.answer?.provided_matches ?? null
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      evaluation_id: evaluationId,
      overall_score: scoring.overallScore,
      passed: scoring.passed,
      missing_mandatory: scoring.missingMandatory
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to submit evaluation', details: err.message });
  } finally {
    await client.end();
  }
});

// GET /api/evaluations/:id
router.get('/evaluations/:id', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { id } = req.params;

  try {
    const evalRes = await client.query(
      `SELECT e.*, u.name as reviewer_name
       FROM evaluations e
       LEFT JOIN users u ON e.reviewer_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    const answersRes = await client.query(
      `SELECT * FROM evaluation_answers WHERE evaluation_id = $1`,
      [id]
    );

    if (evalRes.rowCount === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json({
      evaluation: evalRes.rows[0],
      answers: answersRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch evaluation', details: err.message });
  } finally {
    await client.end();
  }
});

module.exports = router;
