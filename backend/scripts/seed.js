#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined. Check backend/.env and that it has the correct connection string.');
  process.exit(1);
}

console.log('Using DATABASE_URL=', process.env.DATABASE_URL);


const { Client } = require('pg');

function normalizeScaleAnswer(value) {
  // scale is 1-5, normalize to 0-1
  const v = Math.max(1, Math.min(5, value));
  return (v - 1) / 4;
}

function computeKeywordScore(expectedKeywords = [], matched = []) {
  if (!expectedKeywords.length) return 0;
  const matchedCount = expectedKeywords.filter(k =>
    matched.map(m => m.toLowerCase()).includes(k.toLowerCase())
  ).length;
  return Math.min(1, matchedCount / expectedKeywords.length);
}

function scoreEvaluation(questions, answers) {
  let totalWeight = 0;
  let accumulated = 0;
  const missingMandatory = [];

  for (const q of questions) {
    const weight = Number(q.weight || 1);
    totalWeight += weight;

    let questionScore = 0;
    const ans = answers[q.id];

    if (q.type === 'boolean') {
      if (ans === true) questionScore = 1;
      else questionScore = 0;
      if (q.mandatory && !ans) missingMandatory.push(q.id);
    } else if (q.type === 'scale') {
      questionScore = normalizeScaleAnswer(ans); // expects 1-5
    } else if (q.type === 'keyword_presence') {
      questionScore = computeKeywordScore(q.expected_keywords || [], ans || []);
      if (q.mandatory && questionScore === 0) missingMandatory.push(q.id);
    } else if (q.type === 'text') {
      // simple: presence counts
      questionScore = ans ? 1 : 0;
      if (q.mandatory && !ans) missingMandatory.push(q.id);
    } else {
      // fallback
      questionScore = 0;
      if (q.mandatory) missingMandatory.push(q.id);
    }

    accumulated += questionScore * weight;
  }

  const overallScore = totalWeight ? (accumulated / totalWeight) * 100 : 0;
  const passed = missingMandatory.length === 0;

  return {
    overallScore: Number(overallScore.toFixed(2)),
    passed,
    missingMandatory,
    perQuestion: questions.map(q => {
      let normalized = 0;
      const ans = answers[q.id];
      if (q.type === 'boolean') normalized = ans ? 1 : 0;
      else if (q.type === 'scale') normalized = normalizeScaleAnswer(ans);
      else if (q.type === 'keyword_presence')
        normalized = computeKeywordScore(q.expected_keywords || [], ans || []);
      else if (q.type === 'text') normalized = ans ? 1 : 0;
      return {
        question_id: q.id,
        normalized_score: Number(normalized.toFixed(3)),
        answer: ans,
      };
    }),
  };
}

async function upsertCompany(client, name, email) {
  const res = await client.query(
    `
    INSERT INTO companies (name, primary_contact_email)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE SET primary_contact_email = EXCLUDED.primary_contact_email
    RETURNING id
  `,
    [name, email]
  );
  return res.rows[0].id;
}

async function upsertUser(client, company_id, email, name) {
  const res = await client.query(
    `
    INSERT INTO users (company_id, email, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (company_id, email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `,
    [company_id, email, name]
  );
  return res.rows[0].id;
}

async function assignRole(client, user_id, role) {
  await client.query(
    `
    INSERT INTO user_roles (user_id, role)
    VALUES ($1, $2)
    ON CONFLICT (user_id, role) DO NOTHING
  `,
    [user_id, role]
  );
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Company
    const companyId = await upsertCompany(client, 'DemoCo', 'admin@democo.com');
    console.log('Company ID:', companyId);

    // 2. Users
    const agentId = await upsertUser(client, companyId, 'bob.agent@democo.com', 'Bob Agent');
    const reviewerId = await upsertUser(client, companyId, 'alice.reviewer@democo.com', 'Alice Reviewer');

    // 3. Roles
    await assignRole(client, agentId, 'agent');
    await assignRole(client, reviewerId, 'reviewer');

    // 4. Rubric
    const rubricRes = await client.query(
      `
      INSERT INTO rubrics (company_id, name, description, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (company_id, name) DO NOTHING
      RETURNING id
      `,
      [companyId, 'Basic Sales Call', 'Assess discovery, value prop, objections, next step', reviewerId]
    );
    let rubricId;
    if (rubricRes.rows.length) {
      rubricId = rubricRes.rows[0].id;
    } else {
      // fetch existing
      const r = await client.query(
        `SELECT id FROM rubrics WHERE company_id=$1 AND name=$2`,
        [companyId, 'Basic Sales Call']
      );
      rubricId = r.rows[0].id;
    }
    console.log('Rubric ID:', rubricId);

    // 5. Questions
    const questionsData = [
      {
        prompt: 'Did the rep ask discovery questions?',
        type: 'boolean',
        weight: 2,
        mandatory: true,
        expected_keywords: [],
        order_index: 0,
      },
      {
        prompt: 'Was the value proposition clearly stated?',
        type: 'keyword_presence',
        weight: 3,
        mandatory: true,
        expected_keywords: ['value proposition', 'benefit', 'ROI'],
        order_index: 1,
      },
      {
        prompt: 'How well did they handle objections?',
        type: 'scale',
        weight: 2,
        mandatory: false,
        expected_keywords: [],
        order_index: 2,
      },
      {
        prompt: 'Did they ask for the next step?',
        type: 'boolean',
        weight: 3,
        mandatory: true,
        expected_keywords: [],
        order_index: 3,
      },
    ];

    const questionIds = {};
    for (const q of questionsData) {
      const res = await client.query(
        `
        INSERT INTO rubric_questions (
          rubric_id, prompt, type, weight, mandatory, expected_keywords, order_index
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id
        `,
        [
          rubricId,
          q.prompt,
          q.type,
          q.weight,
          q.mandatory,
          q.expected_keywords,
          q.order_index,
        ]
      );
      questionIds[q.prompt] = res.rows[0].id;
    }
    console.log('Question IDs:', questionIds);

    // 6. Call
    const callRes = await client.query(
      `
      INSERT INTO calls (company_id, agent_id, audio_format, duration_seconds, transcript_source, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [companyId, agentId, 'mp3', 180, 'upload', 'ready']
    );
    const callId = callRes.rows[0].id;
    console.log('Call ID:', callId);

    // 7. Transcript
    const transcriptContent = `
Agent: Hello, I wanted to talk about the value proposition and how the ROI shows up for you.
Customer: That sounds interesting, what is the next step?
`;
    await client.query(
      `
      INSERT INTO transcripts (call_id, content, format, version, source)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [callId, transcriptContent.trim(), 'plain', 1, 'upload']
    );

    // 8. Simulate auto-detected answers (this would normally be derived programmatically)
    const sampleAnswers = {
      [questionIds['Did the rep ask discovery questions?']]: true,
      [questionIds['Was the value proposition clearly stated?']]: ['value proposition', 'ROI'],
      [questionIds['How well did they handle objections?']]: 3, // scale 1–5
      [questionIds['Did they ask for the next step?']]: true,
    };

    // 9. Load question rows to pass into scoring
    const qRowsRes = await client.query(
      `
      SELECT id, prompt, type::text, weight, mandatory, expected_keywords
      FROM rubric_questions
      WHERE rubric_id = $1
      ORDER BY order_index
      `,
      [rubricId]
    );
    const questions = qRowsRes.rows.map(r => ({
      id: r.id,
      prompt: r.prompt,
      type: r.type,
      weight: r.weight,
      mandatory: r.mandatory,
      expected_keywords: r.expected_keywords || [],
    }));

    // 10. Score
    const scoring = scoreEvaluation(questions, sampleAnswers);
    console.log('Computed scoring:', scoring);

    // 11. Insert evaluation
    const evalRes = await client.query(
      `
      INSERT INTO evaluations (
        call_id, reviewer_id, rubric_id, overall_score, passed, missing_mandatory_question_ids, comments
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
      `,
      [
        callId,
        reviewerId,
        rubricId,
        scoring.overallScore,
        scoring.passed,
        scoring.missingMandatory,
        'Demo evaluation: auto-detected and adjusted.',
      ]
    );
    const evaluationId = evalRes.rows[0].id;
    console.log('Evaluation ID:', evaluationId);

    // 12. Insert per-question answers
    for (const pq of scoring.perQuestion) {
      const q = questions.find(x => x.id === pq.question_id);
      const fields = {
        evaluation_id: evaluationId,
        question_id: pq.question_id,
        answer_boolean: null,
        answer_scale: null,
        answer_text: null,
        matched_keywords: null,
        normalized_score: pq.normalized_score,
        override: false,
      };
      if (q.type === 'boolean') {
        fields.answer_boolean = pq.answer;
      } else if (q.type === 'scale') {
        fields.answer_scale = pq.answer;
      } else if (q.type === 'keyword_presence') {
        fields.matched_keywords = pq.answer;
      } else if (q.type === 'text') {
        fields.answer_text = pq.answer;
      }

      await client.query(
        `
        INSERT INTO evaluation_answers (
          evaluation_id, question_id,
          answer_boolean, answer_scale, answer_text,
          matched_keywords, normalized_score, override
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          fields.evaluation_id,
          fields.question_id,
          fields.answer_boolean,
          fields.answer_scale,
          fields.answer_text,
          fields.matched_keywords,
          fields.normalized_score,
          fields.override,
        ]
      );
    }

    // 13. Call metrics (simple stub)
    await client.query(
      `
      INSERT INTO call_metrics (
        call_id, talk_listen_ratio, speech_rate, filler_count, sentiment_overall, keyword_matches, additional_metrics
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (call_id) DO UPDATE SET
        talk_listen_ratio = EXCLUDED.talk_listen_ratio,
        speech_rate = EXCLUDED.speech_rate,
        filler_count = EXCLUDED.filler_count,
        sentiment_overall = EXCLUDED.sentiment_overall,
        keyword_matches = EXCLUDED.keyword_matches,
        additional_metrics = EXCLUDED.additional_metrics,
        computed_at = now()
      `,
      [
        callId,
        1.1, // talk/listen
        140, // speech rate
        1, // filler words
        0.85, // sentiment
        { value_prop: true, next_step: true },
        {},
      ]
    );

    await client.query('COMMIT');
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Error during seed, rolling back:', err);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
