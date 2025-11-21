// src/pages/CalendarView.jsx
import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3100';

export default function CalendarView(){
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    // fetch events if API exists
    (async ()=> {
      try {
        setLoading(true);
        const r = await fetch(`${BACKEND}/api/events`);
        if (r.ok) {
          const json = await r.json();
          setEvents(json.events || []);
        }
      } catch (e) {
        console.warn('no calendar events', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ marginTop:12 }}>
      <div className="card">
        <h3>Calendar</h3>
        <p style={{ color:'var(--neutral-600)' }}>Upcoming events and meetings.</p>

        <div style={{ marginTop:12 }}>
          {loading && <div>Loading events…</div>}
          {!loading && events.length === 0 && <div className="card">No upcoming events — sync your calendar.</div>}
          <ul style={{ marginTop:12, display:'grid', gap:8 }}>
            {events.map(ev => (
              <li key={ev.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{ev.title}</div>
                  <div style={{ fontSize:13, color:'var(--neutral-600)' }}>{new Date(ev.start).toLocaleString()}</div>
                </div>
                <div style={{ fontSize:13, color: 'var(--neutral-600)' }}>{ev.location || ''}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
