# Voxera

A voice-native AI workspace. Speak to it, and it transcribes, translates, summarises and
pulls action items out of the conversation — all through Google's Gemini models.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, and a Material 3 design
system. Deployed on Vercel.

---

## The one design rule

**Voxera never lets a canned placeholder masquerade as a real AI answer.**

Every AI-backed route returns provenance alongside its content:

```json
{
  "text": "The capital of France is Paris.",
  "source": "gemini",
  "reason": null,
  "engineConnected": true
}
```

When Gemini is unreachable, rate-limited, or unconfigured, `source` flips to `"demo"`, the
reply says in plain words that it is a placeholder, and the UI renders a banner explaining
why. There is no path in the app where a human reads canned text and believes the model
produced it.

Two distinct failure modes are reported separately, because they need different fixes:

| State | Meaning | UI copy |
| --- | --- | --- |
| `engineConnected: false` | No API key configured. Never connected. | "Demo mode — the AI is not connected." |
| `engineConnected: true`, `source: "demo"` | Key is valid, upstream failed. | "Gemini is connected but returned an error." |

`GET /api/health` reports the same distinction per dependency instead of a bare boolean.

## Features

| Route | What it does |
| --- | --- |
| `/app/live-voice` | Real-time voice chat. Microphone-reactive orb + FFT visualiser, barge-in interrupt, live transcript. |
| `/app/live-translate` | Two speakers, two languages, simultaneous translation with TTS playback. |
| `/app/transcribe` | Speaker-diarated transcription of uploaded audio, plus summary and action items. |
| `/app/conversations` | Saved session history. |
| `/app/audio-lab` | Voice playground — try all 30 TTS voices against the same text. |
| `/app/voice-intelligence` | Voice signal analysis. |
| `/app/action-items` | Action item tracking. |
| `/app/settings` | Engine status, voice, privacy, accessibility. |

**Keyboard shortcuts** (live voice): `Space` talk · `Esc` interrupt · `M` mute · `T` transcript · `L` cycle language.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open <http://localhost:3000>. The app runs fully without any configuration — you just get
honest demo content and a banner telling you what's missing.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables real replies, translation, transcription and TTS. Get one from [Google AI Studio](https://aistudio.google.com/apikey). |
| `DATABASE_URL` | No | Postgres connection string. Required only for saving conversations and action items. |

`.env.local` is gitignored. Never commit a real key.

### Optional: database

Persistence uses Drizzle ORM against Postgres (`conversations`, `action_items` tables).

```bash
npx drizzle-kit push   # or generate + run migrations
```

Without `DATABASE_URL` the database module is never even imported at build time, so builds
and every non-persistence feature keep working. Saving is simply unavailable.

## Models

| Task | Model |
| --- | --- |
| Chat, translation, action extraction, transcription | `gemini-3.8-flash` |
| Text-to-speech | `gemini-3.8-flash-tts` |

### Reliability

`src/lib/gemini.ts` retries transient failures (`408`, `425`, `429`, `500`, `502`, `503`,
`504`) with exponential backoff plus jitter, capped at 30s, and honours the API's own
`RetryInfo.retryDelay` when present.

It deliberately **does not** retry an exhausted daily quota — that would burn 30 seconds
before failing identically. Spent quota and missing keys return immediately with an
explanation.

## Voices

All 30 Gemini TTS voices are selectable and persisted across pages and tabs
(`voxera.voice` in `localStorage`, synced via `useSyncExternalStore`). Names, styles and
genders are verified against Google's published TTS documentation.

`VoicePicker` supports filtering by gender, a description search, and a compact inline mode.

## Theming

Material 3, dark. Tokens live in `src/app/globals.css` as `--md-sys-color-*` CSS custom
properties, consumed by semantic utility classes (`.m3-card`, `.m3-btn-filled`, …).

Roboto is self-hosted through `next/font`. It is exposed as `--font-roboto` and chained into
`--font-sans` / `--font-display` — note that declaring `--font-sans` inside `@theme` would
shadow `next/font`'s own variable and silently break font loading.

Honours `prefers-reduced-motion` and `prefers-contrast`, with manual high-contrast and
reduced-motion toggles in Settings.

## Project structure

```
src/
  app/
    api/            route handlers, all returning source/reason provenance
    app/            the application shell and its pages
  components/       UI, including VoiceOrb and AudioVisualizer
  hooks/            microphone, speech recognition/synthesis, voice preference
  lib/
    gemini.ts       model calls, retry/backoff, quota detection, TTS
    demoData.ts     the canned bank, and honest labelling of it
    voices.ts       30-voice catalogue with styles and genders
    wav.ts          RIFF detection and base64 WAV conversion
  db/               Drizzle schema and lazy pool
```

## Scripts

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build
npm run start       # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

## Deploying

The repo is connected to Vercel, so pushing to `main` deploys automatically.

Set `GEMINI_API_KEY` (and optionally `DATABASE_URL`) in the Vercel project's Environment
Variables for all three environments. Until then, production serves demo mode with the
banner visible.

### Browser support

Real-time speech features want Chrome or Edge (Web Speech API + `getUserMedia` with Web
Audio analysis). Other browsers get a reduced but still functional experience, and the app
tells them which features are limited rather than failing silently.

## Known limitations

- **4 moderate `npm audit` findings** remain, all dev-only, in `drizzle-kit`'s bundled
  `esbuild`. The suggested fix is a semver-*downgrade* of `drizzle-kit` to 0.18.1, which is
  a worse trade. Runtime dependencies are clean.
- `next.config.ts` pins `turbopack.root`, because the app was originally scaffolded inside a
  monorepo-style parent directory. Harmless, but it can be removed if the repo is ever moved.
- Speaker diarization in Transcribe depends on the model; short or overlapping speakers may be
  merged or split.
