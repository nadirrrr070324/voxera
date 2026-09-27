"use client";

import { useCallback, useRef, useState } from "react";
import { SpeakerBadge } from "@/components/SpeakerBadge";
import { ActionItemsView } from "@/components/ActionItemsView";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { ActionsResult, TranscribeResult } from "@/lib/types";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function TranscribePage() {
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [transcript, setTranscript] = useState<TranscribeResult | null>(null);
  const [actions, setActions] = useState<ActionsResult | null>(null);
  const [source, setSource] = useState<"gemini" | "demo" | null>(null);
  const [sourceReason, setSourceReason] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recorder = useAudioRecorder();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const processAudio = useCallback(async (blob: Blob, mimeType: string) => {
    setStatus("processing");
    const base64 = await blobToBase64(blob);
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64: base64, mimeType }),
    }).then((r) => r.json());

    setTranscript(res.result);
    setSource(res.source);
    setSourceReason(res.reason ?? null);
    setStatus("done");

    const transcriptText = (res.result as TranscribeResult).segments
      .map((s) => `${s.speaker} (${s.timestamp}): ${s.text}`)
      .join("\n");
    const actionsRes = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: transcriptText }),
    }).then((r) => r.json());
    setActions(actionsRes.result);
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processAudio(file, file.type || "audio/mpeg");
    },
    [processAudio],
  );

  const onToggleRecord = useCallback(async () => {
    if (recorder.recording) {
      const result = await recorder.stop();
      if (result) await processAudio(result.blob, result.mimeType);
    } else {
      await recorder.start();
    }
  }, [recorder, processAudio]);

  const saveConversation = useCallback(async () => {
    if (!transcript) return;
    setSaving(true);
    try {
      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Smart Transcript — ${new Date().toLocaleDateString()}`,
          mode: "transcribe",
          languages: ["en"],
          participantCount: transcript.speakerCount,
          durationSeconds: 0,
          transcript: transcript.segments.map((s) => ({
            speaker: s.speaker,
            text: s.text,
            timestampMs: 0,
          })),
          summary: actions?.summary ?? transcript.summary,
          decisions: actions?.decisions ?? [],
          followUps: actions?.followUps ?? [],
          actionItems: actions?.actionItems ?? [],
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [transcript, actions]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Smart Transcribe</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Upload a meeting, interview, or call — Voxera separates speakers and turns it into structured work.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 m3-card">
        <input ref={fileRef} type="file" accept="audio/*,video/mp4" className="hidden" onChange={onFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          className="m3-btn-outlined"
        >
          📁 Upload audio
        </button>
        <button
          onClick={onToggleRecord}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            recorder.recording
              ? "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]"
              : "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90"
          }`}
        >
          {recorder.recording ? "◼ Stop recording" : "🎙️ Record now"}
        </button>
        {status === "processing" && (
          <span className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--md-sys-color-primary)]" /> Identifying speakers…
          </span>
        )}
        {source && (
          <span className="ml-auto text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {source === "gemini" ? "Gemini Audio Engine" : "Demo Mode result"}
          </span>
        )}
      </div>

      {source === "demo" && sourceReason && (
        <div
          role="status"
          className="rounded-2xl p-4 text-sm"
          style={{
            background: "var(--md-sys-color-tertiary-container)",
            color: "var(--md-sys-color-on-tertiary-container)",
          }}
        >
          <span className="font-medium">This transcript is canned demo content, not a real transcription.</span>{" "}
          <span className="opacity-80">{sourceReason}</span>
        </div>
      )}

      {transcript && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="m3-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Meeting Transcript</h2>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{transcript.speakerCount} speakers detected</span>
            </div>
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
              {transcript.segments.map((s, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <SpeakerBadge speaker={s.speaker} />
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{s.timestamp}</span>
                  </div>
                  <p className="rounded-2xl bg-[var(--md-sys-color-surface-container-high)] px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)]">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="m3-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">From Conversation to Action</h2>
              <button
                onClick={saveConversation}
                disabled={saving}
                className="m3-btn-outlined !px-3 !py-1 !text-xs"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save Conversation"}
              </button>
            </div>
            {actions ? <ActionItemsView result={actions} /> : <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Generating summary & action items…</p>}
          </div>
        </div>
      )}
    </div>
  );
}
