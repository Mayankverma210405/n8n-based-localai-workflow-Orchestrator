# N8N-Based LocalAI Workflow Orchestration Platform

Welcome to the repository for a fully private, containerized workflow automation stack combining [n8n](https://n8n.io/) with [LocalAI](https://github.com/go-skynet/LocalAI), built for robust calendar scheduling, intent parsing, and event execution using on-device LLMs.

---

## 📌 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [System Requirements](#system-requirements)
5. [Getting Started](#getting-started)
6. [Folder Structure](#folder-structure)
7. [Services Overview](#services-overview)
8. [Configuration](#configuration)
9. [LLM Integration](#llm-integration)
10. [API Reference](#api-reference)
11. [Sample Payloads](#sample-payloads)
12. [Troubleshooting](#troubleshooting)
13. [Performance Notes](#performance-notes)
14. [Customization](#customization)
15. [Security](#security)
16. [License](#license)

---

## 📖 Overview

This project is an end-to-end, modular AI-first automation system. It combines:

* **n8n**: Workflow orchestrator for backend automation
* **Node.js Backend**: REST API for email/event parsing
* **LocalAI**: Local LLM inference engine for classification/summarization
* **Frontend (Vite + React)**: UI for interacting with parsed events and triggering workflows

Use case: Parse emails locally using a small LLM (e.g., TinyLlama), classify them as meeting invites, extract intent, and schedule calendar events through n8n.

---

## 🚀 Key Features

* ⚙️ No cloud dependencies — 100% offline processing
* 🤖 Local LLMs using GGUF model format (e.g. TinyLlama, Galatolo)
* 🧠 Email summarization, intent extraction, attendee parsing
* 📅 Calendar event creation via n8n workflows
* 🔄 Webhook execution from backend to n8n
* 📦 Fully dockerized
* 💻 Frontend for manual review and debugging

---

## 🏗 Architecture

```text
+------------+         +-------------+        +-----------+
|            |  HTTP   |             |  HTTP  |           |
|  Frontend  +-------->+  Backend    +------->+  LocalAI  |
| (Vite+React)         | (Node.js)   |        |           |
+------------+         +-------------+        +-----------+
                           |
                           | Webhook
                           v
                      +--------+
                      |  n8n   |
                      +--------+
```

---

## 💻 System Requirements

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* 4+ GB RAM
* ~7 GB disk space for LLM models

---

## 🧰 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/n8n-based-localai-workflow.git
cd n8n-based-localai-workflow
```

### 2. Create `.env` Files

Duplicate and customize `.env.sample` in each service directory (backend, frontend).

### 3. Pull or Add LLM Models

Download `.gguf` models (e.g. TinyLlama) to `localai-data/models/`

### 4. Build & Start Services

```bash
docker compose build
docker compose up -d
```

### 5. Check Status

```bash
docker ps
curl http://localhost:3100/health   # Backend
curl http://localhost:8000/readyz    # LocalAI
```

---

## 🗂 Folder Structure

```text
.
├── backend
│   ├── src
│   ├── Dockerfile
│   └── .env
├── frontend
│   ├── src
│   ├── Dockerfile
│   └── .env
├── localai-data
│   └── models
├── n8n
│   └── ...
├── docker-compose.yml
└── README.md
```

---

## 🔌 Services Overview

### ✅ Backend (Node.js)

* Runs on `localhost:3100`
* Provides `/api/parse` and `/api/execute` endpoints
* Parses incoming emails to structured plans

### 🌐 Frontend (React/Vite)

* Runs on `localhost:5173`
* Provides simple UI for testing parsing or invoking webhook execution

### 🧠 LocalAI

* Runs on `localhost:8000`
* Accepts OpenAI-style API requests (`/v1/chat/completions`, etc.)
* Expects `.gguf` models in `/data/models`

### 🔁 n8n

* Exposed on `localhost:5678`
* Receives plans from backend via webhook: `/webhook/chat-to-calendar`

---

## ⚙️ Configuration

### `docker-compose.yml`

Make sure:

```yaml
LOCALAI_URL=http://localai:8080
N8N_WEBHOOK_URL=http://n8n:5678/webhook/chat-to-calendar
```

### `.env` in Backend

```env
PORT=3100
LOCALAI_URL=http://localai:8080
N8N_WEBHOOK_URL=http://n8n:5678/webhook/chat-to-calendar
```

### `.env` in Frontend

```env
VITE_BACKEND_URL=http://localhost:3100
```

---

## 🤖 LLM Integration

### Supported Model Format

* `.gguf` (e.g. TinyLlama, Galatolo)
* Place in `localai-data/models/`

### Classification Prompt (Example)

```json
{
  "model": "tinyllama-1.1b-chat-v0.3.Q4_K_M",
  "messages": [
    {
      "role": "user",
      "content": "Classify this email: Subject: 'Meet Alice' Body: 'Tomorrow 3pm'"
    }
  ]
}
```

---

## 📡 API Reference

### POST `/api/parse`

Parses email content into a structured plan.

#### Request

```json
{
  "subject": "Meet Alice",
  "text": "Schedule a meeting tomorrow 3pm with alice@example.com",
  "from": "bob@example.com"
}
```

#### Response

```json
{
  "ok": true,
  "skip": false,
  "plan": {
    "intent": "create_event",
    "summary": "Meet Alice",
    "start": "2025-11-21T15:00:00Z",
    "end": "2025-11-21T15:30:00Z",
    "attendees": ["alice@example.com"],
    "llm": {...}
  }
}
```

---

## 🧪 Sample Payloads

### Event-like Email

```json
{
  "subject": "Zoom call with client",
  "text": "Let's meet on Friday at 4pm to finalize the deal",
  "from": "john@example.com"
}
```

### Output

```json
{
  "intent": "create_event",
  "summary": "Zoom call with client",
  "start": "...",
  "attendees": []
}
```

---

## 🛠 Troubleshooting

| Problem                      | Diagnosis                         | Solution                             |
| ---------------------------- | --------------------------------- | ------------------------------------ |
| LocalAI returns 500          | Model not loaded                  | Ensure correct model name in payload |
| Backend healthcheck fails    | Startup crash or port conflict    | Run `docker compose logs backend`    |
| Plan intent is always `none` | LLM not returning structured JSON | Adjust prompt or increase tokens     |

---

## ⚡ Performance Notes

* LLM inference is CPU-based unless manually optimized
* Prefer small quantized `.gguf` models (Q4_K or Q5_K)
* Do not commit models > 100MB to Git. Use `.gitignore`

---

## 🧩 Customization

### Add Another Model

* Drop `.gguf` file into `localai-data/models/`
* Restart `localai` container

### Update Prompt Style

Edit `src/parse-route.js` in backend:

```js
const llmPrompt = `Classify this email as MEETING or OTHER...`;
```

### Change Webhook

Update `N8N_WEBHOOK_URL` in backend `.env`

---

## 🔒 Security

* Avoid exposing `localai` and `n8n` ports publicly
* Keep `.env` files out of version control
* Use `N8N_BASIC_AUTH` for login protection

---

## 📄 License

MIT License. See `LICENSE` file for details.

---

## 📬 Contact

Maintained by: `Mayankverma`
For suggestions, issues or contributions, open a GitHub issue.

---

> This project aims to provide a fully offline, transparent, and modifiable alternative to cloud-based automation stacks — with private inference and user control at the core.

---

*This README file is handcrafted for maximum transparency, completeness and onboarding ease. Contributions welcome!*
