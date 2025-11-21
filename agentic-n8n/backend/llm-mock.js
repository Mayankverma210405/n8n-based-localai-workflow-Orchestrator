// backend/src/llm-mock.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/generate', (req, res) => {
  const { prompt } = req.body || {};
  // Very naive heuristic: if the prompt contains "MEETING" or "meeting" => MEETING
  const lower = (prompt || '').toLowerCase();
  const label = (lower.includes('meeting') || lower.includes('schedule') || lower.includes('tomorrow')) ? 'MEETING' : 'OTHER';
  const confidence = label === 'MEETING' ? 0.92 : 0.65;
  const text = label === 'MEETING'
    ? 'MEETING'
    : 'OTHER';

  // return JSON similar to what your backend expects
  return res.json({ label, confidence, text, notes: 'mocked result' });
});

const PORT = process.env.LLM_MOCK_PORT || 8000;
app.listen(PORT, () => console.log('✅ LLM mock listening on', PORT));
