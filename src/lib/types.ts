export type ChatTurn = {
  role: "user" | "ai";
  text: string;
};

export type DiarizedSegment = {
  speaker: string;
  timestamp: string;
  text: string;
};

export type TranscribeResult = {
  summary: string;
  segments: DiarizedSegment[];
  speakerCount: number;
};

export type ActionsResult = {
  summary: string;
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
  followUps: string[];
};

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", bcp47: "en-US" },
  { code: "hi", label: "Hindi", flag: "🇮🇳", bcp47: "hi-IN" },
  { code: "te", label: "Telugu", flag: "🇮🇳", bcp47: "te-IN" },
  { code: "ta", label: "Tamil", flag: "🇮🇳", bcp47: "ta-IN" },
  { code: "bn", label: "Bengali", flag: "🇧🇩", bcp47: "bn-IN" },
  { code: "ur", label: "Urdu", flag: "🇵🇰", bcp47: "ur-PK" },
  { code: "es", label: "Spanish", flag: "🇪🇸", bcp47: "es-ES" },
  { code: "fr", label: "French", flag: "🇫🇷", bcp47: "fr-FR" },
  { code: "de", label: "German", flag: "🇩🇪", bcp47: "de-DE" },
  { code: "ja", label: "Japanese", flag: "🇯🇵", bcp47: "ja-JP" },
  { code: "ko", label: "Korean", flag: "🇰🇷", bcp47: "ko-KR" },
  { code: "ar", label: "Arabic", flag: "🇸🇦", bcp47: "ar-SA" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
