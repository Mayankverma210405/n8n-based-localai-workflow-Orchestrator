// backend/src/mails-route.js
const express = require("express");
const { listMails } = require("./mail-store");

const router = express.Router();

/*
  GET /api/mails
  Returns recently stored raw mails
  (Mounted at /api in index.js, so final path: /api/mails)
*/
router.get("/mails", async (req, res) => {
  try {
    const mails = await listMails();
    res.json({ ok: true, mails });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/*
  GET /api/extracted
  Returns recently extracted/parsed items stored by the backend
  (Mounted at /api in index.js, so final path: /api/extracted)
*/
router.get("/extracted", async (req, res) => {
  try {
    const { listExtracted } = require("./mail-store");
    const items = await listExtracted(parseInt(req.query.limit || "50", 10));
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("extracted list error", err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

module.exports = router;
