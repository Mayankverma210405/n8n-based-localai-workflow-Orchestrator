// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const CalendarView = lazy(() => import('../pages/CalendarView'));
const EmailList = lazy(() => import('../pages/EmailList'));
const Settings = lazy(() => import('../pages/Settings'));

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <div className="hero" style={{ marginTop: 18 }}>
          <div className="hero-left">
            <h2>Agentic — Inbox & Scheduling Assistant</h2>
            <p>Ask the assistant questions about your emails, find meetings, and manage schedules — all powered by your mailbox + LLMs.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <NavLink to="/chat" className="btn primary">Open Chat</NavLink>
            <NavLink to="/calendar" className="btn">Calendar</NavLink>
          </div>
        </div>

        <Suspense fallback={<div className="card">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/emails" element={<EmailList />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<div className="card"><h3>Not found</h3><p>Page not found.</p></div>} />
          </Routes>
        </Suspense>

        <Footer />
      </main>
    </BrowserRouter>
  );
}
