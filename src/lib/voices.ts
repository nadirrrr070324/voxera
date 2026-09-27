/**
 * The 30 prebuilt voices supported by the Gemini TTS models
 * (gemini-3.8-flash-tts, gemini-3.1-flash-tts-preview, gemini-2.5-*-preview-tts).
 */
export type Voice = {
  name: string;
  /** Timbre/character as described by Google. */
  style: string;
  gender: "Female" | "Male";
};

export const GEMINI_VOICES: readonly Voice[] = [
  { name: "Zephyr", style: "Bright", gender: "Female" },
  { name: "Puck", style: "Upbeat", gender: "Male" },
  { name: "Charon", style: "Informative", gender: "Male" },
  { name: "Kore", style: "Firm", gender: "Female" },
  { name: "Fenrir", style: "Excitable", gender: "Male" },
  { name: "Leda", style: "Youthful", gender: "Female" },
  { name: "Orus", style: "Firm", gender: "Male" },
  { name: "Aoede", style: "Breezy", gender: "Female" },
  { name: "Callirrhoe", style: "Easy-going", gender: "Female" },
  { name: "Autonoe", style: "Bright", gender: "Female" },
  { name: "Enceladus", style: "Breathy", gender: "Male" },
  { name: "Iapetus", style: "Clear", gender: "Male" },
  { name: "Umbriel", style: "Easy-going", gender: "Male" },
  { name: "Algieba", style: "Smooth", gender: "Male" },
  { name: "Despina", style: "Smooth", gender: "Female" },
  { name: "Erinome", style: "Clear", gender: "Female" },
  { name: "Algenib", style: "Gravelly", gender: "Male" },
  { name: "Rasalgethi", style: "Informative", gender: "Male" },
  { name: "Laomedeia", style: "Upbeat", gender: "Female" },
  { name: "Achernar", style: "Soft", gender: "Female" },
  { name: "Alnilam", style: "Firm", gender: "Male" },
  { name: "Schedar", style: "Even", gender: "Female" },
  { name: "Gacrux", style: "Mature", gender: "Female" },
  { name: "Pulcherrima", style: "Forward", gender: "Female" },
  { name: "Achird", style: "Friendly", gender: "Male" },
  { name: "Zubenelgenubi", style: "Casual", gender: "Male" },
  { name: "Vindemiatrix", style: "Gentle", gender: "Female" },
  { name: "Sadachbia", style: "Lively", gender: "Male" },
  { name: "Sadaltager", style: "Knowledgeable", gender: "Male" },
  { name: "Sulafat", style: "Warm", gender: "Female" },
] as const;

export const DEFAULT_VOICE = "Kore";

const NAMES = new Set(GEMINI_VOICES.map((v) => v.name));

/** Guards against arbitrary strings reaching the Gemini speechConfig. */
export function isValidVoice(name: string | undefined | null): name is string {
  return typeof name === "string" && NAMES.has(name);
}

/** Falls back to the default voice when the requested one is not supported. */
export function resolveVoice(name: string | undefined | null): string {
  return isValidVoice(name) ? name : DEFAULT_VOICE;
}
