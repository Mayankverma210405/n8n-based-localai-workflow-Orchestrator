// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard(){
  return (
    <div style={{ marginTop: 12 }}>
      <div className="app-layout">
        <aside className="sidebar card">
          <div className="side-section">
            <div style={{ fontWeight:700, marginBottom:8 }}>Workspace</div>
            <a className="side-item" href="/emails">Inbox <span className="badge">12</span></a>
            <a className="side-item" href="/calendar">Calendar</a>
            <a className="side-item" href="/chat">Assistant</a>
          </div>

          <div className="side-section">
            <div style={{ fontWeight:700, marginBottom:8 }}>Settings</div>
            <a className="side-item" href="/settings">Preferences</a>
          </div>
        </aside>

        <section>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3>Overview</h3>
            <p style={{ color:'var(--neutral-600)' }}>Quick snapshot of your inbox and upcoming meetings.</p>
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <div className="card" style={{ padding:16, flex:1 }}>
                <div style={{ fontSize: 12, color: 'var(--neutral-600)' }}>Unread emails</div>
                <div style={{ fontSize: 28, fontWeight:800 }}>12</div>
              </div>
              <div className="card" style={{ padding:16, flex:1 }}>
                <div style={{ fontSize: 12, color: 'var(--neutral-600)' }}>Next meeting</div>
                <div style={{ fontSize: 16, fontWeight:700 }}>Today • 3:00 PM</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Quick actions</h3>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <Link to="/chat" className="btn primary">Ask Assistant</Link>
              <Link to="/emails" className="btn">Open Inbox</Link>
              <Link to="/calendar" className="btn">Open Calendar</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
