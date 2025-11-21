// src/parse-route.js
const express = require("express");
const chrono = require("chrono-node");
const he = require("he");
const { pushMail } = require("./mail-store");
const { callLLM } = require("./llm-client"); // <-- corrected name

function extractEmails(text) {
  if (!text) return [];
  const re = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = text.match(re) || [];
  return [...new Set(matches)];
}

function makeSummary(subject, text) {
  if (subject && subject.trim().length) return subject.trim();
  if (!text) return "Meeting";
  const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 0);
  return (firstLine || text).trim().slice(0, 120);
}

function parseDateRange(text) {
  if (!text) return null;
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  if (!results || !results.length) return null;
  const r = results[0];
  let start = r.start ? r.start.date() : null;
  let end = r.end ? r.end.date() : null;
  if (start && !end) end = new Date(start.getTime() + 30 * 60 * 1000);
  if (!start) return null;
  const fmt = d => d.toISOString();
  return { start: fmt(start), end: fmt(end) };
}

const router = express.Router();

// POST /api/parse
router.post("/parse", express.json(), async (req, res) => {
  if (!req.body) return res.status(400).json({ ok: false, error: "Empty body" });

  const { text = "", subject = "" } = req.body || {};
  const body = he.decode(text || "");
  const subj = he.decode(subject || "");

  try {
    await pushMail({ subject: subj, text: body, raw: req.body, createdAt: new Date().toISOString() });
  } catch (err) {
    console.warn("mail store error:", err?.message || err);
  }

  const lower = (subj + " " + body).toLowerCase();
  if (lower.includes("delivery status notification") || lower.includes("undeliverable") ||
      lower.includes("mail delivery subsystem") || lower.includes("mailer-daemon")) {
    return res.json({ ok: true, skip: true, reason: "bounce/auto" });
  }

  // LLM-assisted classification (non-blocking fallback)
  let llmResult = null;
  try {
    const modelName = process.env.LOCALAI_MODEL || undefined;
    const llmPrompt = `Classify this email as MEETING or OTHER. Subject: "${subj}" Body: "${body}". Return a JSON object: {"label":"MEETING"|"OTHER","confidence":0.0,"notes":"..."}`
    // callLLM returns { ok, url, status, raw, text }
    llmResult = await callLLM({
      model: modelName,
      prompt: llmPrompt,
      params: { max_new_tokens: 150 } // LocalAI param shorthand; favours "max_new_tokens" but pass-through is allowed
    });

    // If the LLM returned a textual JSON string in llmResult.text, try to parse it
    if (llmResult && typeof llmResult.text === 'string') {
      try {
        const maybe = JSON.parse(llmResult.text);
        llmResult = Object.assign({}, llmResult, maybe);
      } catch (_) {
        // not JSON — keep as llmResult.text
      }
    }
  } catch (e) {
    console.warn("LLM classify failed", e?.message || e);
  }

  const dateRange = parseDateRange(subj) || parseDateRange(body) || null;
  const foundEmails = extractEmails(body);
  const attendees = foundEmails;

  let label = null;
  if (llmResult && typeof llmResult.label === 'string') label = llmResult.label;
  else if (llmResult && typeof llmResult.text === 'string') {
    const t = llmResult.text.toLowerCase();
    if (t.includes('meeting') || t.includes('call') || t.includes('schedule')) label = 'MEETING';
  }

  const plan = {
    intent: (label && label.toUpperCase() === "MEETING") ? "create_event" : "none",
    summary: makeSummary(subj, body),
    start: dateRange ? dateRange.start : null,
    end: dateRange ? dateRange.end : null,
    attendees,
    description: `Parsed from: ${JSON.stringify(req.body).slice(0, 300)}`,
    llm: llmResult
  };

  const skip = plan.intent !== "create_event";
  try {
    const { pushExtractedItem } = require('./mail-store');
    await pushExtractedItem({ ...plan, source: 'llm_parse', raw: req.body });
  } catch (err) {
    console.warn('failed to persist extracted plan:', err?.message || err);
  }

  return res.json({ ok: true, skip, plan });
});

router.post("/execute", express.json(), async (req, res) => {
  const plan = req.body.plan;
  if (!plan) return res.status(400).json({ ok: false, error: "missing plan" });

  const webhook = process.env.N8N_WEBHOOK_URL || null;
  if (!webhook) return res.json({ ok: true, message: "no webhook configured", plan });

  const fetch = require('node-fetch');
  try {
    const r = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(plan) });
    const text = await r.text();
    return res.json({ ok: true, status: r.status, body: text });
  } catch (err) {
    console.error("execute webhook failed:", err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

module.exports = router;
