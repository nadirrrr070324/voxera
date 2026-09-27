import type { ActionsResult, TranscribeResult } from "./types";

// Rich, deterministic fallback content so the product is fully demoable
// even without a configured GEMINI_API_KEY. Every AI route attempts a real
// Gemini call first and only falls back to this content on error/absence.

const REPLY_BANK: { match: RegExp; reply: string }[] = [
  {
    match: /quantum/i,
    reply:
      "Think of a quantum computer as exploring many possible answers at once, instead of one at a time like a normal computer.",
  },
  {
    match: /simpler|simple/i,
    reply:
      "Sure — imagine flipping thousands of coins at once instead of one by one. That's the kind of shortcut quantum bits give you.",
  },
  {
    match: /hello|hi there|hey/i,
    reply: "Hey! I'm listening. Go ahead, speak naturally — you can interrupt me any time.",
  },
  {
    match: /translate|translation/i,
    reply: "I can translate this conversation in real time. Try switching the speaker language in Live Translate.",
  },
  {
    match: /summary|summarize/i,
    reply: "Here's a quick summary: the conversation covered the main proposal, two open questions, and one clear next step.",
  },
  {
    match: /action item|task|follow up/i,
    reply: "I've pulled out the action items and assigned owners based on who committed to what during the conversation.",
  },
];

/**
 * Canned replies used ONLY when no Gemini key is configured or the API call
 * fails. These must never pretend to be real answers — a confident-sounding
 * fabrication is far worse than an honest "not connected".
 *
 * `connected` distinguishes the two failure modes: a missing key (never
 * connected) versus a live key that hit a transient upstream error.
 */
export function demoReply(userText: string, connected = false): string {
  const trimmed = userText.trim();
  if (!trimmed) {
    return "I'm here whenever you're ready — just start speaking.";
  }
  for (const entry of REPLY_BANK) {
    if (entry.match.test(userText)) return entry.reply;
  }
  if (connected) {
    return `Gemini is temporarily overloaded, so I can't answer "${trimmed.slice(0, 120)}" right now. Try again in a moment.`;
  }
  const where = process.env.VERCEL
    ? "in the Vercel project's environment variables"
    : "in .env.local and restart the server";
  return `I can't answer that yet — Voxera isn't connected to Gemini, so this is a placeholder instead of a real reply. Set GEMINI_API_KEY ${where} to get a genuine answer to "${trimmed.slice(0, 120)}".`;
}

const DEMO_TRANSLATIONS: Record<string, string> = {
  "where are you from": "आप कहाँ से आए हैं",
  "आप कहाँ से आए हैं": "Where are you from?",
  "how are you": "आप कैसे हैं",
  "आप कैसे हैं": "How are you?",
  "good morning": "सुप्रभात",
  "सुप्रभात": "Good morning",
  "thank you": "धन्यवाद",
  "धन्यवाद": "Thank you",
};

export function demoTranslate(text: string, targetLabel: string): string {
  const key = text.trim().toLowerCase();
  if (DEMO_TRANSLATIONS[key]) return DEMO_TRANSLATIONS[key];
  return `[not translated — ${targetLabel} demo] ${text}`;
}

export const DEMO_TRANSCRIBE: TranscribeResult = {
  summary:
    "The team aligned on shipping the beta next Friday, contingent on finishing authentication work by Thursday. QA ownership was assigned and a rollback plan was requested.",
  speakerCount: 3,
  segments: [
    { speaker: "Speaker 1", timestamp: "10:02", text: "We should launch the beta next Friday." },
    { speaker: "Speaker 2", timestamp: "10:03", text: "Before that, we need to finish authentication." },
    { speaker: "Speaker 3", timestamp: "10:04", text: "I'll handle the testing once auth lands." },
    { speaker: "Speaker 1", timestamp: "10:05", text: "Great — can we also prep a rollback plan just in case?" },
    { speaker: "Speaker 2", timestamp: "10:06", text: "Yes, I'll draft it alongside the auth work." },
    { speaker: "Speaker 3", timestamp: "10:07", text: "I'll share a QA checklist by tomorrow morning." },
  ],
};

export const DEMO_ACTIONS: ActionsResult = {
  summary:
    "The team confirmed a beta launch target of Friday, pending authentication completion. Testing and rollback planning were assigned to unblock the release.",
  decisions: [
    "Beta launch is planned for Friday",
    "Authentication must be completed before launch",
    "A rollback plan will be prepared alongside auth work",
  ],
  actionItems: [
    { task: "Finish authentication", owner: "Speaker 2", deadline: "Thursday" },
    { task: "Complete QA testing", owner: "Speaker 3", deadline: "Thursday" },
    { task: "Prepare beta launch", owner: "Speaker 1", deadline: "Friday" },
    { task: "Draft rollback plan", owner: "Speaker 2", deadline: "Thursday" },
  ],
  followUps: [
    "Create project task in tracker",
    "Draft follow-up email to stakeholders",
    "Add calendar reminder for Friday launch",
    "Export meeting notes to shared drive",
  ],
};
