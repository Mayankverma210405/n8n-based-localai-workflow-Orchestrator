// src/llm-mock.js
const express = require('express');
const bodyParser = require('body-parser');

const PORT = process.env.MOCK_LLM_PORT || 8000;
const app = express();
app.use(bodyParser.json());

// Simple classifier helper
function classifyText(subject = '', body = '') {
  const text = `${subject}\n${body}`.toLowerCase();
  const meetingKeywords = ['meeting', 'call', 'schedule', ' appointment ', 'book a call'];
  let score = 0;
  for (const k of meetingKeywords) if (text.includes(k)) score += 1;
  // simple email extraction
  const emails = (body.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || []);
  const label = score > 0 ? 'MEETING' : 'OTHER';
  const confidence = Math.min(0.95, 0.5 + score * 0.2 + (emails.length ? 0.1 : 0));
  return { label, confidence, notes: `mock classifier (kw:${score}, emails:${emails.length})` };
}

// Generic handler for /generate and /v1/completions
function handler(req, res) {
  const payload = req.body || {};
  // Determine subject/body heuristically
  let subject = '';
  let body = '';
  if (payload.prompt && typeof payload.prompt === 'string') {
    const mSub = payload.prompt.match(/Subject:\s*"([^"]+)"/i);
    const mBody = payload.prompt.match(/Body:\s*"([^"]+)"/i);
    subject = mSub ? mSub[1] : '';
    body = mBody ? mBody[1] : payload.prompt;
  } else if (payload.messages && Array.isArray(payload.messages)) {
    body = payload.messages.map(m => m.content || '').join('\n');
  } else {
    subject = payload.subject || '';
    body = payload.input || payload.text || (payload.prompt || '');
  }
  const result = classifyText(subject, body);
  return res.json({ label: result.label, confidence: result.confidence, notes: result.notes, raw: { subject, body } });
}

// Support legacy /generate
app.post('/generate', handler);
// Support simple OpenAI-style completion endpoint
app.post('/v1/completions', handler);

// Support chat completions: return openai-like wrapper
app.post('/v1/chat/completions', (req, res) => {
  const payload = req.body || {};
  let concat = '';
  if (Array.isArray(payload.messages)) concat = payload.messages.map(m => m.content || '').join('\n');
  else concat = payload.prompt || payload.input || '';
  const classified = classifyText('', concat);
  const choiceText = JSON.stringify(classified);
  return res.json({
    id: 'mock-chat-1',
    object: 'chat.completion',
    choices: [{ index: 0, message: { role: 'assistant', content: choiceText } }],
    usage: {}
  });
});

app.listen(PORT, () => {
  console.log(`✅ Mock LLM listening on http://localhost:${PORT} (endpoints: /generate, /v1/completions, /v1/chat/completions)`);
});
