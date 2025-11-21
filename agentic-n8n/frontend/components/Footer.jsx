// src/components/Footer.jsx
import React from 'react';

export default function Footer(){
  return (
    <footer className="app-footer" role="contentinfo" aria-label="Site footer">
      <div className="container">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ fontSize: 14 }}>
            © {new Date().getFullYear()} Agentic — Built with care.
          </div>
          <div style={{ color:'var(--neutral-600)', fontSize:13 }}>
            <a href="/privacy" style={{ color: 'inherit', textDecoration:'none', marginRight:12 }}>Privacy</a>
            <a href="/terms" style={{ color: 'inherit', textDecoration:'none' }}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
