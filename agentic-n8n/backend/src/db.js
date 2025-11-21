const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'agentic.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Open DB (synchronous, simpler API)
const db = new Database(DB_FILE);

// Run migrations (idempotent)
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS mails (
  id TEXT PRIMARY KEY,
  subject TEXT,
  text TEXT,
  raw TEXT,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS extracted (
  id TEXT PRIMARY KEY,
  intent TEXT,
  summary TEXT,
  start TEXT,
  end TEXT,
  attendees TEXT,
  description TEXT,
  llm TEXT,
  source TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_extracted_start ON extracted(start);
`);

module.exports = {
  db,
  insertMail: function (mail) {
    const stmt = db.prepare(
      `INSERT INTO mails (id,subject,text,raw,created_at) VALUES (@id,@subject,@text,@raw,@created_at)`
    );
    const entry = {
      id: mail.id || String(Date.now()) + Math.floor(Math.random() * 1000),
      subject: mail.subject || null,
      text: mail.text || null,
      raw: JSON.stringify(mail.raw || null),
      created_at: mail.createdAt || new Date().toISOString(),
    };
    stmt.run(entry);
    return entry;
  },
  listMails: function (limit = 100) {
    const rows = db.prepare(`SELECT id,subject,text,raw,created_at FROM mails ORDER BY created_at DESC LIMIT ?`).all(limit);
    return rows.map(r => ({
      id: r.id,
      subject: r.subject,
      text: r.text,
      raw: r.raw ? JSON.parse(r.raw) : null,
      createdAt: r.created_at
    }));
  },
  insertExtracted: function (item) {
    const stmt = db.prepare(
      `INSERT INTO extracted (id,intent,summary,start,end,attendees,description,llm,source,created_at) VALUES (@id,@intent,@summary,@start,@end,@attendees,@description,@llm,@source,@created_at)`
    );
    const entry = {
      id: item.id || `ex_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      intent: item.intent || null,
      summary: item.summary || null,
      start: item.start || null,
      end: item.end || null,
      attendees: JSON.stringify(item.attendees || []),
      description: item.description ? String(item.description).slice(0, 2000) : null,
      llm: item.llm ? JSON.stringify(item.llm) : null,
      source: item.source || null,
      created_at: item.createdAt || new Date().toISOString(),
    };
    stmt.run(entry);
    return { ...entry, attendees: JSON.parse(entry.attendees), llm: entry.llm ? JSON.parse(entry.llm) : null };
  },
  listExtracted: function (limit = 100) {
    const rows = db.prepare(`SELECT * FROM extracted ORDER BY created_at DESC LIMIT ?`).all(limit);
    return rows.map(r => ({
      id: r.id,
      intent: r.intent,
      summary: r.summary,
      start: r.start,
      end: r.end,
      attendees: r.attendees ? JSON.parse(r.attendees) : [],
      description: r.description,
      llm: r.llm ? JSON.parse(r.llm) : null,
      source: r.source,
      createdAt: r.created_at
    }));
  }
};
