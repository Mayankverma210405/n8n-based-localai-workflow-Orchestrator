// src/pages/Settings.jsx
import React, { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [summary, setSummary] = useState(true);

  return (
    <div style={{ marginTop:12 }}>
      <div className="card">
        <h3>Preferences</h3>
        <p style={{ color:'var(--neutral-600)' }}>Manage your workspace preferences and integrations.</p>

        <div style={{ marginTop:16, display:'grid', gap:12 }}>
          <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700 }}>Email notifications</div>
              <div style={{ color:'var(--neutral-600)', fontSize:13 }}>Receive email updates about activity</div>
            </div>
            <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
              <span style={{ fontSize:13 }}>{notifications ? 'On' : 'Off'}</span>
            </label>
          </div>

          <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700 }}>Daily summary</div>
              <div style={{ color:'var(--neutral-600)', fontSize:13 }}>Get a daily digest of meetings and messages</div>
            </div>
            <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={summary} onChange={e => setSummary(e.target.checked)} />
              <span style={{ fontSize:13 }}>{summary ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
