"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { SpeakerBadge } from "@/components/SpeakerBadge";

type TranscriptSegment = { speaker: string; text: string; timestampMs: number };
type ActionItem = { id: number; task: string; owner: string; deadline: string; done: boolean };
type Conversation = {
  id: number;
  title: string;
  mode: string;
  languages: string[];
  participantCount: number;
  durationSeconds: number;
  transcript: TranscriptSegment[];
  summary: string;
  decisions: string[];
  followUps: string[];
  createdAt: string;
};

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setConversation(d.conversation ?? null);
        setActionItems(d.actionItems ?? []);
      });
  }, [id]);

  if (!conversation) {
    return <div className="p-8 text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading…</div>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <Link href="/app/conversations" className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]">
        ← Back to conversations
      </Link>
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">{conversation.title}</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          {Math.round(conversation.durationSeconds / 60)} min • {(conversation.languages ?? []).join(", ") || "en"} •{" "}
          {conversation.participantCount} participants
        </p>
      </header>

      <section className="m3-card">
        <h2 className="mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Summary</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface)]">{conversation.summary || "No summary available."}</p>
      </section>

      {conversation.decisions?.length > 0 && (
        <section className="m3-card">
          <h2 className="mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Key Decisions</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-[var(--md-sys-color-on-surface)]">
            {conversation.decisions.map((d, i) => (
              <li key={i}>• {d}</li>
            ))}
          </ul>
        </section>
      )}

      {actionItems.length > 0 && (
        <section className="m3-card">
          <h2 className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Action Items</h2>
          <div className="flex flex-col gap-2">
            {actionItems.map((a) => (
              <div key={a.id} className="flex items-center justify-between border border-[var(--md-sys-color-outline-variant)] px-3 py-2 text-sm">
                <span className="text-[var(--md-sys-color-on-surface)]">{a.task}</span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{a.owner} • {a.deadline}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="m3-card">
        <h2 className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Transcript</h2>
        <div className="flex flex-col gap-3">
          {conversation.transcript.map((s, i) => (
            <div key={i} className="flex flex-col gap-1">
              <SpeakerBadge speaker={s.speaker} />
              <p className="rounded-2xl bg-[var(--md-sys-color-surface-container-high)] px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
