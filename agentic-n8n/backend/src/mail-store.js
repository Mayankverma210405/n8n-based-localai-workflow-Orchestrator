/*
  backend/src/mail-store.js
  SQLite-backed mail store - thin wrapper around src/db.js
*/
const dbapi = require('./db');

// pushMail(item): insert raw mail into mails table
async function pushMail(item) {
  try {
    const entry = dbapi.insertMail({
      id: item.id,
      subject: item.subject,
      text: item.text,
      raw: item.raw || item,
      createdAt: item.createdAt
    });
    return entry;
  } catch (err) {
    console.error('pushMail error', err);
    throw err;
  }
}

async function getMail(id) {
  try {
    const all = dbapi.listMails(1000);
    return all.find(m => m.id === id) || null;
  } catch (err) {
    console.error('getMail error', err);
    throw err;
  }
}

async function listMails(limit = 100) {
  try {
    return dbapi.listMails(limit);
  } catch (err) {
    console.error('listMails error', err);
    throw err;
  }
}

// Persist an extracted/parsed item
async function pushExtractedItem(item) {
  try {
    return dbapi.insertExtracted(item);
  } catch (err) {
    console.error('pushExtractedItem error', err);
    throw err;
  }
}

// List extracted items
async function listExtracted(limit = 100) {
  try {
    return dbapi.listExtracted(limit);
  } catch (err) {
    console.error('listExtracted error', err);
    throw err;
  }
}

module.exports = {
  pushMail,
  getMail,
  listMails,
  pushExtractedItem,
  listExtracted
};
