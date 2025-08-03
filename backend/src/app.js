const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/evaluations'));
app.use('/api', require('./routes/calls'));

app.get('/', (req, res) => {
  res.send('Call QA API running ✅');
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
