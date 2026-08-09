"use client";

import type { HitlSession } from "@/lib/db";
import { useEffect, useMemo, useState } from "react";

function countdown(expiresAt: string) {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function SessionConsole({ initial }: { initial: HitlSession[] }) {
  const [sessions, setSessions] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [, tick] = useState(0);
  const selected = useMemo(() => sessions.find((item) => item.id === selectedId) ?? sessions[0], [sessions, selectedId]);

  useEffect(() => {
    const timer = setInterval(async () => {
      tick((value) => value + 1);
      const response = await fetch("/api/sessions", { cache: "no-store" });
      if (response.ok) setSessions((await response.json()).sessions);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  async function answer(value: string) {
    if (!selected) return;
    const response = await fetch(`/api/sessions/${selected.id}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: value }) });
    if (response.ok) {
      const { session } = await response.json();
      setSessions((items) => items.map((item) => item.id === session.id ? session : item));
    }
  }

  return <div className="console-grid">
    <aside className="session-list">
      <div className="list-heading"><span>Sessions</span><span className="live-dot">Live</span></div>
      {sessions.length === 0 && <div className="empty-small">No sessions yet.<br />Call <code>create_session</code> through MCP.</div>}
      {sessions.map((item) => <button key={item.id} className={`session-row ${selected?.id === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)}>
        <span className={`status-dot ${item.status}`} />
        <span><strong>{item.integration}</strong><small>{item.question}</small></span>
        {item.status === "waiting" && <time>{countdown(item.expires_at)}</time>}
      </button>)}
    </aside>
    <section className="conversation">
      {!selected ? <div className="empty-state"><div>∞</div><h2>Waiting for an agent</h2><p>New HITL requests will appear here in real time.</p></div> : <>
        <header className="conversation-header">
          <div><p className="eyebrow">{selected.integration}</p><h2>Human decision requested</h2></div>
          <span className={`status-pill ${selected.status}`}>{selected.status === "waiting" ? `${countdown(selected.expires_at)} remaining` : selected.status}</span>
        </header>
        <div className="message-area">
          <div className="agent-message"><span className="avatar">A</span><div><small>Agent · just now</small><p>{selected.question}</p></div></div>
          {selected.status === "waiting" ? <div className="answer-panel">
            <p>Select a response</p>
            <div className="options">{selected.options.map((option) => <button key={option} onClick={() => answer(option)}>{option}</button>)}</div>
            <small>Your identity and timestamp are recorded with this decision.</small>
          </div> : selected.status === "answered" ? <div className="human-message"><small>Human response · {selected.answered_by}</small><strong>{selected.answer}</strong></div> : <div className="closed-message">No human response was recorded. Session {selected.status}.</div>}
        </div>
        <footer className="session-meta"><span>Session</span><code>{selected.id}</code><span>Created</span><time>{new Date(selected.created_at).toLocaleString()}</time></footer>
      </>}
    </section>
  </div>;
}
