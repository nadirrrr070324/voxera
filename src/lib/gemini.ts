import type { ActionsResult, ChatTurn, TranscribeResult } from "./types";
import { resolveVoice } from "./voices";
import { DEMO_ACTIONS, DEMO_TRANSCRIBE, demoReply, demoTranslate } from "./demoData";

const TEXT_MODEL = "gemini-3.8-flash";
const TTS_MODEL = "gemini-3.8-flash-tts";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export type Source = "gemini" | "demo";
export type Result<T> = { result: T; source: Source; reason?: string };

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function missingKeyReason(): string {
  return "GEMINI_API_KEY is not set — returning canned demo content instead of a real answer.";
}

/** HTTP codes that are worth retrying: rate limits and upstream overload. */
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 600;
/** Cap so a server asking for a very long wait can't stall a voice turn. */
const MAX_DELAY_MS = 30_000;

export class GeminiError extends Error {
  readonly status: number;
  readonly transient: boolean;
  /** Server-requested wait before retrying, parsed from `RetryInfo.retryDelay`. */
  readonly retryAfterMs?: number;
  /** True when a free-tier daily quota is spent, so retrying cannot help. */
  readonly quotaExhausted: boolean;

  constructor(message: string, status: number, rawBody: string) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.transient = TRANSIENT_STATUS.has(status);

    const seconds = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(rawBody);
    this.retryAfterMs = seconds ? Math.round(Number(seconds[1]) * 1000) : undefined;

    this.quotaExhausted =
      this.status === 429 &&
      /exceeded your current quota|free_tier_requests|RESOURCE_EXHAUSTED/i.test(rawBody);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGeminiOnce(model: string, body: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${BASE_URL}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new GeminiError(`Gemini error ${res.status}: ${errText.slice(0, 300)}`, res.status, errText);
    }
    return (await res.json()) as Record<string, any>;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls Gemini with backoff on transient failures (rate limits and upstream
 * overload). Without this a momentary 503 makes the whole turn fall back to
 * canned demo content, which reads to the user as a wrong answer.
 *
 * Honors the server's `RetryInfo.retryDelay` when present, and gives up
 * immediately when the free-tier daily quota is spent (retrying cannot help).
 */
async function callGemini(model: string, body: Record<string, unknown>) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce(model, body);
    } catch (err) {
      lastErr = err;
      if (!(err instanceof GeminiError) || !err.transient || err.quotaExhausted) throw err;
      if (attempt === MAX_ATTEMPTS) throw err;

      // Server-requested wait wins; otherwise exponential backoff with jitter:
      // 600ms, 1.2s, 2.4s (+/- 25%).
      const jittered = BASE_DELAY_MS * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5);
      const delay = Math.min(MAX_DELAY_MS, Math.max(jittered, err.retryAfterMs ?? 0));
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** Human-readable reason for a failed call, distinguishing overload from a real outage. */
function failureReason(err: unknown): string {
  if (err instanceof GeminiError && err.quotaExhausted) {
    return `Gemini free-tier quota is exhausted (HTTP 429) for this project. Retrying will not help until the quota resets or a billing plan is added — showing canned demo content.`;
  }
  if (err instanceof GeminiError && err.transient) {
    return `Gemini is temporarily overloaded (HTTP ${err.status}) and stayed unavailable after ${MAX_ATTEMPTS} attempts. Showing canned demo content.`;
  }
  return `Gemini request failed (${String(err)}). Showing canned demo content.`;
}

export async function generateReply(history: ChatTurn[]): Promise<Result<string>> {
  const lastUser = [...history].reverse().find((t) => t.role === "user")?.text ?? "";
  if (!hasGeminiKey()) {
    return { result: demoReply(lastUser), source: "demo", reason: missingKeyReason() };
  }
  try {
    const contents = history.map((t) => ({
      role: t.role === "user" ? "user" : "model",
      parts: [{ text: t.text }],
    }));
    const data = await callGemini(TEXT_MODEL, {
      contents,
      systemInstruction: {
        parts: [
          {
            text: "You are Voxera, a warm, concise real-time voice assistant. Keep replies to 1-3 short spoken sentences, natural and conversational, since they will be spoken aloud. Answer the user's actual question directly and accurately — never describe what you are about to do, and never claim to have performed an action you did not perform. If you are unsure, say so plainly.",
          },
        ],
      },
      // Gemini 3.x ignores temperature/top_p/top_k; `thinkingConfig.thinkingLevel`
      // is the supported control. "low" keeps voice latency tight.
      generationConfig: {
        maxOutputTokens: 300,
        thinkingConfig: { thinkingLevel: "low" },
      },
    });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("model returned an empty response");
    return { result: text, source: "gemini" };
  } catch (err) {
    return {
      result: demoReply(lastUser, true),
      source: "demo",
      reason: failureReason(err),
    };
  }
}

export async function translateText(
  text: string,
  sourceLabel: string,
  targetLabel: string,
): Promise<Result<string>> {
  if (!hasGeminiKey()) {
    return { result: demoTranslate(text, targetLabel), source: "demo", reason: missingKeyReason() };
  }
  try {
    const data = await callGemini(TEXT_MODEL, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Translate the following ${sourceLabel} sentence into natural, conversational ${targetLabel}. Reply with only the translation, nothing else.\n\nSentence: ${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 200,
        thinkingConfig: { thinkingLevel: "low" },
      },
    });
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!translated) throw new Error("model returned an empty response");
    return { result: translated, source: "gemini" };
  } catch (err) {
    return {
      result: demoTranslate(text, targetLabel),
      source: "demo",
      reason: failureReason(err),
    };
  }
}

export async function synthesizeSpeech(
  text: string,
  voiceName?: string,
): Promise<{ audioBase64: string; mimeType: string } | null> {
  if (!hasGeminiKey()) return null;
  const voice = resolveVoice(voiceName);
  try {
    const data = await callGemini(TTS_MODEL, {
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!part?.data) return null;
    return { audioBase64: part.data as string, mimeType: (part.mimeType as string) ?? "audio/wav" };
  } catch {
    return null;
  }
}

const TRANSCRIBE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    segments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          speaker: { type: "STRING" },
          timestamp: { type: "STRING" },
          text: { type: "STRING" },
        },
        required: ["speaker", "timestamp", "text"],
      },
    },
  },
  required: ["summary", "segments"],
};

export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
): Promise<Result<TranscribeResult>> {
  if (!hasGeminiKey()) {
    return { result: DEMO_TRANSCRIBE, source: "demo", reason: missingKeyReason() };
  }
  try {
    const data = await callGemini(TEXT_MODEL, {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Audio } },
            {
              text: "Transcribe this audio, identifying distinct speakers as Speaker 1, Speaker 2, etc, with approximate MM:SS timestamps. Also give a short summary.",
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TRANSCRIBE_SCHEMA,
      },
    });
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("model returned an empty response");
    const parsed = JSON.parse(raw) as { summary: string; segments: { speaker: string; timestamp: string; text: string }[] };
    const speakerCount = new Set(parsed.segments.map((s) => s.speaker)).size;
    return { result: { summary: parsed.summary, segments: parsed.segments, speakerCount }, source: "gemini" };
  } catch (err) {
    return {
      result: DEMO_TRANSCRIBE,
      source: "demo",
      reason: failureReason(err),
    };
  }
}

export async function extractActions(transcriptText: string): Promise<Result<ActionsResult>> {
  if (!hasGeminiKey()) {
    return { result: DEMO_ACTIONS, source: "demo", reason: missingKeyReason() };
  }
  try {
    const data = await callGemini(TEXT_MODEL, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `From this transcript, extract a JSON object with keys: summary (string), decisions (string array), actionItems (array of {task, owner, deadline}), followUps (string array). Transcript:\n\n${transcriptText}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            decisions: { type: "ARRAY", items: { type: "STRING" } },
            actionItems: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  task: { type: "STRING" },
                  owner: { type: "STRING" },
                  deadline: { type: "STRING" },
                },
                required: ["task", "owner", "deadline"],
              },
            },
            followUps: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["summary", "decisions", "actionItems", "followUps"],
        },
      },
    });
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("model returned an empty response");
    const parsed = JSON.parse(raw) as ActionsResult;
    return { result: parsed, source: "gemini" };
  } catch (err) {
    return {
      result: DEMO_ACTIONS,
      source: "demo",
      reason: failureReason(err),
    };
  }
}
