// src/pages/ChatPage.jsx
import React from 'react';
import ChatApp from '../ChatApp';

export default function ChatPage(){
  return (
    <div style={{ marginTop: 12 }}>
      <div className="card">
        <h3>Assistant</h3>
        <p style={{ color:'var(--neutral-600)' }}>Ask questions about your emails and schedule.</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <ChatApp />
      </div>
    </div>
  );
}
