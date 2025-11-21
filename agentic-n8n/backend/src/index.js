// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const parseRoute = require('./parse-route');
const chatRoute  = require('./chat-route');
const mailsRoute = require('./mails-route');
const eventsRoute = require('./events-route');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', eventsRoute);

// Basic health endpoint for Docker healthchecks
app.get('/', (req, res) => res.json({ ok: true, service: 'agentic-backend' }));
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Register routes
app.use('/api', parseRoute);
app.use('/api', chatRoute);
app.use('/api', mailsRoute);

// static debug (optional) - serve data folder read-only for debugging
app.use('/data', express.static(path.join(__dirname, 'data')));

const PORT = parseInt(process.env.PORT || '3100', 10);
app.listen(PORT, () => {
  console.log('✅ Backend running on port', PORT);
});
