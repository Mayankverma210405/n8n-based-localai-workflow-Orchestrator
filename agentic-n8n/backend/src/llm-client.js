/**
 * backend/src/llm-client.js
 * Robust LocalAI client:
 *  - Reads model from process.env.LOCALAI_MODEL (falls back to string "gpt-3")
 *  - Tries v1/chat/completions -> v1/completions -> /generate
 *  - Uses correct payload shape for each endpoint
 *  - Returns normalized { ok, url, status, raw, text }
 *  - Exports both callLLM and callLocalLLM for compatibility
 */

const axios = require("axios");

const TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "15000", 10);
const RETRIES = parseInt(process.env.LLM_RETRIES || "2", 10);

// candidate base URLs (prefer compose service name)
const DEFAULTS = [
  (process.env.LOCALAI_URL && process.env.LOCALAI_URL.trim()) || null,
  "http://localai:8080",
  "http://localhost:8080",
  "http://localhost:8000",
].filter(Boolean);

const BASE_URL = DEFAULTS[0];

const DEFAULT_MODEL = (process.env.LOCALAI_MODEL && process.env.LOCALAI_MODEL.trim()) || "gpt-3";

function log(...args) {
  try { console.log("[llm-client]", ...args); } catch (e) {}
}

/** perform an axios POST */
async function doPost(url, payload) {
  log("POST ->", url, "payloadKeys=", Object.keys(payload));
  const res = await axios.post(url, payload, {
    timeout: TIMEOUT_MS,
    headers: { "Content-Type": "application/json" },
  });
  return { status: res.status, data: res.data };
}

/**
 * callLLM({ prompt, messages, model, params })
 *  - model defaults to LOCALAI_MODEL or DEFAULT_MODEL
 *  - messages: array of {role, content} for chat usage
 */
async function callLLM({ model = null, prompt = "", messages = null, params = {} } = {}) {
  const resolvedModel = (model && String(model).trim()) || DEFAULT_MODEL;
  if (!BASE_URL) {
    const msg = "No LOCALAI_URL configured and no fallback available";
    log(msg);
    return { ok: false, error: "no_base_url", message: msg };
  }

  const endpoints = [
    { url: `${BASE_URL.replace(/\/$/, "")}/v1/chat/completions`, type: "chat" },
    { url: `${BASE_URL.replace(/\/$/, "")}/v1/completions`, type: "completion" },
    { url: `${BASE_URL.replace(/\/$/, "")}/generate`, type: "generate" },
  ];

  for (const ep of endpoints) {
    let payload;
    if (ep.type === "chat") {
      payload = {
        model: resolvedModel,
        messages: messages || [{ role: "user", content: String(prompt || "") }],
        ...params,
      };
    } else if (ep.type === "completion") {
      // LocalAI "completions" sometimes accepts "input" or "prompt" depending on backend,
      // prefer "input" (some localai builds expect it) but include other forms via params if needed.
      payload = {
        model: resolvedModel,
        input: prompt || (Array.isArray(messages) ? messages.map(m => m.content).join("\n") : ""),
        // keep compatibility: some requesters may expect prompt instead
        prompt: prompt || (Array.isArray(messages) ? messages.map(m => m.content).join("\n") : ""),
        ...params,
      };
    } else {
      payload = {
        model: resolvedModel,
        prompt: prompt || (Array.isArray(messages) ? messages.map(m => m.content).join("\n") : ""),
        ...params,
      };
    }

    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      try {
        const result = await doPost(ep.url, payload);
        const d = result.data;

        // robust extraction of human text (many shapes covered)
        let text = null;
        const tryGet = (fn) => {
          try {
            const v = fn();
            if (typeof v === "string" && v.length > 0) return v;
            // if v is an object/array we don't want it as text here
            return (v === undefined ? null : v);
          } catch (e) {
            return null;
          }
        };

        // 1) Prefer completions-style: d.choices[0].text (many LocalAI completions use this)
        text = tryGet(() => d?.choices?.[0]?.text);

        // 2) Chat-style: choices[0].message.content (OpenAI chat shape)
        if (!text) text = tryGet(() => d?.choices?.[0]?.message?.content);

        // 3) Streaming delta content
        if (!text) text = tryGet(() => d?.choices?.[0]?.delta?.content);

        // 4) Top-level simple text
        if (!text) text = tryGet(() => d?.text);

        // 5) LocalAI modern: d.output -> array -> output[0].data[0].content[0].text
        if (!text) {
          text = tryGet(() => {
            if (d?.output && Array.isArray(d.output) && d.output[0]) {
              const out0 = d.output[0];
              if (out0?.data && Array.isArray(out0.data) && out0.data[0]?.content) {
                return out0.data[0].content[0]?.text || null;
              } else if (out0?.content && Array.isArray(out0.content)) {
                const c0 = out0.content[0];
                return (typeof c0 === "string") ? c0 : (c0?.text || null);
              } else if (typeof out0 === "string") {
                return out0;
              }
            }
            return null;
          });
        }

        // 6) d.data[0] style
        if (!text) {
          text = tryGet(() => {
            if (d?.data && Array.isArray(d.data) && d.data[0]) {
              const item = d.data[0];
              if (typeof item === "string") return item;
              if (item?.text) return item.text;
              if (item?.content) return (typeof item.content === "string") ? item.content : (item.content[0]?.text || null);
            }
            return null;
          });
        }

        // 7) other common fields
        if (!text) text = tryGet(() => d?.response || d?.completion || d?.result?.text);
        if (!text) text = tryGet(() => d?.message || d?.msg);

        // Final fallback: stringify something useful for debugging (limited length)
        if (!text) {
          if (d?.error || d?.message) text = JSON.stringify(d).slice(0, 800);
          else {
            try { text = JSON.stringify(d).slice(0, 2000); } catch (e) { text = String(d); }
          }
        }

        log(`Success -> ${ep.url} status=${result.status} textLen=${text ? text.length : 0}`);
        return { ok: true, url: ep.url, status: result.status, raw: d, text };
      } catch (err) {
        const code = err && err.code ? err.code : null;
        const msg = err && err.message ? err.message : String(err);
        log(`Request failed -> ${ep.url} attempt=${attempt+1} errorCode=${code} message=${msg}`);
        if (attempt === RETRIES) break;
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
    }
  }

  const message = `All LLM endpoints failed (tried ${DEFAULTS.join(", ")})`;
  log(message);
  return { ok: false, error: "llm_error", message };
}

// Export both names for compatibility with existing code that expects callLocalLLM
module.exports = {
  callLLM,
  callLocalLLM: callLLM,
  TIMEOUT_MS
};
