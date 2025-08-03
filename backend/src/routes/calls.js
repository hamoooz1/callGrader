// backend/src/routes/calls.js
const express = require('express');
const router = express.Router();
const { Client } = require('pg');

router.get('/calls', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT c.id, c.agent_id, u.name AS agent_name, c.created_at
      FROM calls c
      LEFT JOIN users u ON c.agent_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calls' });
  } finally {
    await client.end();
  }
});

// Extend backend/src/routes/calls.js
router.get('/calls/:id', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { id } = req.params;

  try {
    const [callRes, transcriptRes, evaluationsRes] = await Promise.all([
      client.query(`SELECT * FROM calls WHERE id = $1`, [id]),
      client.query(`SELECT * FROM transcripts WHERE call_id = $1 ORDER BY version DESC LIMIT 1`, [id]),
      client.query(`
        SELECT e.*, u.name as reviewer_name
        FROM evaluations e
        LEFT JOIN users u ON e.reviewer_id = u.id
        WHERE e.call_id = $1
      `, [id])
    ]);

    res.json({
      call: callRes.rows[0],
      transcript: transcriptRes.rows[0],
      evaluations: evaluationsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch call details' });
  } finally {
    await client.end();
  }
});


module.exports = router;
