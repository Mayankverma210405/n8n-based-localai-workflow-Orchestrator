// src/chat-route.js
const express = require('express');
const { callLLM: callLocalLLM } = require('./llm-client');

const { listMails } = require('./mail-store');

const router = express.Router();

// POST /api/chat
// Body: { prompt: string, includeRecentMails: boolean, maxMails: number }
router.post('/chat', express.json(), async (req, res) => {
  try {
    const { prompt = '', includeRecentMails = false, maxMails = 5 } = req.body || {};
    let context = prompt;

    if (includeRecentMails) {
      const mails = await listMails(maxMails);
      const joined = mails.map(m => `Subject: ${m.subject}\n${m.text}`).join('\n\n---\n\n');
      context = `Context:\n${joined}\n\nUser prompt:\n${prompt}`;
    }

    const llmResp = await callLocalLLM(context, { maxTokens: 400 });

    // If llmResp has text or choices, normalize to text
    const text = llmResp && (llmResp.text || (llmResp.choices && llmResp.choices[0] && (llmResp.choices[0].text || (llmResp.choices[0].message && llmResp.choices[0].message.content)))) || '';

    return res.json({ ok: true, text, raw: llmResp });
  } catch (err) {
    console.error('chat error:', err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

module.exports = router;
