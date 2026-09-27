"use client";

export function MicDeniedNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] p-6 text-center">
      <p className="text-lg font-medium text-[var(--md-sys-color-on-error-container)]">
        Microphone access is required for Live Voice.
      </p>
      <p className="max-w-sm text-sm text-[var(--md-sys-color-on-error-container)]/80">
        Voxera needs microphone permission to listen in real time. Nothing is recorded until you speak.
      </p>
      <button
        onClick={onRetry}
        className="m3-btn-filled mt-2 !px-5 !py-2"
      >
        Enable Microphone
      </button>
    </div>
  );
}

export function UnsupportedBrowserNotice() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] p-6 text-center">
      <p className="text-lg font-medium text-[var(--md-sys-color-on-surface)]">Limited real-time audio support</p>
      <p className="max-w-sm text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Your browser does not fully support the real-time speech features Voxera prefers (best experienced in Chrome
        or Edge). You can still use text input and the recorded Transcribe flow.
      </p>
    </div>
  );
}

export function ConnectionLostNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] p-4">
      <p className="text-sm text-[var(--md-sys-color-on-error-container)]">Connection interrupted.</p>
      <button
        onClick={onRetry}
        className="m3-btn-outlined !px-4 !py-1.5 !text-xs"
      >
        Reconnect
      </button>
    </div>
  );
}

export function EngineUnavailableNotice() {
  return (
    <div className="m3-card text-sm text-[var(--md-sys-color-on-surface-variant)]">
      Voice engine running in <span className="text-[var(--md-sys-color-primary)]">Demo Mode</span> — connect a{" "}
      <code className="rounded bg-[var(--md-sys-color-surface-container-highest)] px-1 py-0.5 text-[var(--md-sys-color-on-surface)]">GEMINI_API_KEY</code> to enable the live Gemini
      audio engine.
    </div>
  );
}
