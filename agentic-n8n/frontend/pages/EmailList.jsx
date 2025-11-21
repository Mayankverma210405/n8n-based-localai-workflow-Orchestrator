// src/pages/EmailList.jsx
import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3100';

export default function EmailList(){
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ fetchMails() }, []);

  async function fetchMails(){
    try {
      setLoading(true);
      const r = await fetch(`${BACKEND}/api/mails`);
      const json = await r.json();
      if (json.ok) setMails(json.mails || []);
    } catch(e){
      console.error('fetch mails', e);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop:12 }}>
      <div className="card">
        <h3>Inbox</h3>
        <p style={{ color:'var(--neutral-600)' }}>Recent emails fetched from the backend.</p>

        <div style={{ marginTop:12 }}>
          {loading && <div>Loading emails…</div>}
          {!loading && mails.length === 0 && <div className="card">No emails found.</div>}
          <div style={{ marginTop:8 }}>
            {mails.map(m => (
              <div key={m.id} className="mail-item card" style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div className="subject">{m.subject || '(no subject)'}</div>
                    <div className="meta">{m.from} • {new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ marginTop:8, color:'var(--neutral-600)' }}>{(m.text || '').slice(0, 240)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
