// src/components/Header.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="app-header" role="banner">
      <div className="container">
        <a className="brand" href="/" aria-label="Agentic Home">
          <div className="logo" aria-hidden="true">AG</div>
          <h1>Agentic</h1>
        </a>

        <nav className="nav" role="navigation" aria-label="Main navigation">
          <NavLink to="/" end className={({isActive})=> isActive ? 'active' : ''} aria-current={({isActive}) => isActive ? 'page' : undefined}>Home</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/emails">Emails</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <div className="header-actions">
          <button className="btn ghost" title="Notifications">🔔</button>
          <button className="btn" title="Profile">👤</button>
          <button className="btn primary" onClick={()=>alert('Connect wallet — integrate in next PR')}>Connect</button>

          <button
            className="btn"
            onClick={() => setOpen(p => !p)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            style={{ display: 'none' /* keep for mobile hook if you later display */ }}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
