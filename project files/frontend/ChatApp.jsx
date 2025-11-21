// src/ChatApp.jsx
import React, { useState, useEffect, useRef } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3100';

export default function ChatApp() {
  const [mails, setMails] = useState([]);
  const [loadingMails, setLoadingMails] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { fetchMails(); }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchMails(){
    try {
      setLoadingMails(true);
      const r = await fetch(`${BACKEND}/api/mails`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      if (json.ok) setMails(json.mails || []);
    } catch(e) {
      console.error('fetchMails', e);
    } finally {
      setLoadingMails(false);
    }
  }

  async function sendPrompt(prompt, contextMails = true) {
    if (!prompt) return;
    const userMsg = { role: 'user', text: prompt, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setBusy(true);

    try {
      const body = { prompt, includeRecentMails: contextMails, maxMails: 5 };
      const r = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const errText = await r.text();
        setMessages(prev => [...prev, { role: 'assistant', text: `Server error: ${r.status} ${errText}` }]);
        return;
      }

      const json = await r.json();
      if (json.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: json.text || JSON.stringify(json, null, 2) }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${json.error || 'unknown'}` }]);
      }
    } catch (err) {
      console.error('chat error', err);
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    await sendPrompt(trimmed, true);
    setInput('');
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
      {/* Mail list */}
      <aside className="sidebar" aria-label="Mail list">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <strong>Stored mails</strong>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" onClick={fetchMails} disabled={loadingMails} aria-busy={loadingMails}>
              {loadingMails ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div>
          {mails.length === 0 && <div style={{ color:'var(--neutral-600)' }}>No stored mails.</div>}
          {mails.map(m => (
            <div key={m.id} className="mail-item" role="article" tabIndex={0} aria-label={m.subject || 'mail'}>
              <div className="subject">{m.subject || '(no subject)'}</div>
              <div className="meta">{m.from} • {new Date(m.createdAt).toLocaleString()}</div>
              <div style={{ marginTop:8, color:'var(--neutral-600)' }}>{(m.text || '').slice(0, 140)}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <main className="chat-main" aria-live="polite">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div>
            <h3 style={{ margin:0 }}>Assistant</h3>
            <div style={{ color:'var(--neutral-600)', fontSize:13 }}>Ask about emails, meetings or request summaries.</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" onClick={()=> setMessages([])}>Clear</button>
            <button className="btn" onClick={() => sendPrompt('Summarize my unread emails', true)} disabled={busy}>Auto Summarize</button>
          </div>
        </div>

        <div ref={scrollRef} className="chat-log" role="log" aria-live="polite" aria-atomic="false">
          {messages.map((m,i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="role">{m.role}</div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSend} aria-label="Compose message" style={{ marginTop:8 }}>
          <input
            className="input"
            placeholder="Ask (e.g. 'List meetings with Alice next week')"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={busy}
            aria-disabled={busy}
          />
          <button className="btn primary" type="submit" disabled={busy || !input.trim()} aria-disabled={busy || !input.trim()}>
            {busy ? 'Sending…' : 'Send'}
          </button>
        </form>

        <div style={{ marginTop: 10, display:'flex', gap:8 }}>
          <button className="btn" onClick={() => sendPrompt('List upcoming meetings', true)}>List meetings</button>
          <button className="btn" onClick={() => sendPrompt('Extract action items from latest email', true)}>Extract actions</button>
        </div>
      </main>
    </div>
  );
}
