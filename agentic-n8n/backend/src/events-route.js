// src/events-route.js
const express = require('express');
const router = express.Router();

// GET /api/events
router.get('/events', (req, res) => {
  return res.json({ ok: true, events: [] });
});

// POST /api/events (optional)
router.post('/events', (req, res) => {
  // simple echo for testing
  return res.json({ ok: true, received: req.body || null });
});

module.exports = router;
