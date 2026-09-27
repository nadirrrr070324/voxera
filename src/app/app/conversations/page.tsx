"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Conversation = {
  id: number;
  title: string;
  mode: string;
  languages: string[];
  participantCount: number;
  durationSeconds: number;
  summary: string;
  createdAt: string;
};

const MODE_LABEL: Record<string, string> = {
  "live-voice": "Live Voice",
  "live-translate": "Live Translate",
  transcribe: "Smart Transcribe",
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Conversations</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Every saved session — transcripts, summaries, and decisions in one place.</p>
      </header>

      {loading && <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading…</p>}
      {!loading && conversations.length === 0 && (
        <div className="m3-card text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
          No saved conversations yet. Start a Live Voice session or transcribe a recording, then save it.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/app/conversations/${c.id}`}
            className="flex flex-col gap-2 m3-card flex flex-col gap-2 transition"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-0.5 text-[11px] text-[var(--md-sys-color-primary)]">
                {MODE_LABEL[c.mode] ?? c.mode}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="text-base font-medium text-[var(--md-sys-color-on-surface)]">{c.title}</h3>
            <p className="line-clamp-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">{c.summary || "No summary generated."}</p>
            <div className="mt-1 flex gap-4 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              <span>{Math.round(c.durationSeconds / 60)} min</span>
              <span>{(c.languages ?? []).join(", ") || "en"} • {c.participantCount} participants</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
