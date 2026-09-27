"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type ActionItem = {
  id: number;
  task: string;
  owner: string;
  deadline: string;
  done: boolean;
  conversationId: number | null;
  conversationTitle: string | null;
};

export default function ActionItemsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/action-items")
      .then((r) => r.json())
      .then((d) => setItems(d.actionItems ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: number, done: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done } : i)));
    await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  };

  const pending = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Action Items</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Every task Voxera extracted from your conversations, all in one place.</p>
      </header>

      {loading && <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="m3-card text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
          No action items yet. Save a conversation from Live Voice or Transcribe to generate some.
        </div>
      )}

      {pending.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="m3-label text-[var(--md-sys-color-on-surface-variant)]">Pending ({pending.length})</h2>
          {pending.map((item) => (
            <Row key={item.id} item={item} onToggle={toggle} />
          ))}
        </section>
      )}

      {completed.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="m3-label text-[var(--md-sys-color-on-surface-variant)]">Completed ({completed.length})</h2>
          {completed.map((item) => (
            <Row key={item.id} item={item} onToggle={toggle} />
          ))}
        </section>
      )}
    </div>
  );
}

function Row({ item, onToggle }: { item: ActionItem; onToggle: (id: number, done: boolean) => void }) {
  return (
    <div
      className={cn(
        "m3-card flex items-center gap-3 !rounded-2xl px-4 py-3 transition",
        item.done && "opacity-50",
      )}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
      />
      <div className="flex-1">
        <p className={cn("text-sm text-[var(--md-sys-color-on-surface)]", item.done && "line-through")}>{item.task}</p>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          {item.owner} • {item.deadline}
          {item.conversationTitle && <> • from “{item.conversationTitle}”</>}
        </p>
      </div>
    </div>
  );
}
