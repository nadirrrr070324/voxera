"use client";

import { useCallback, useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslationPanel } from "@/components/TranslationPanel";
import { VoicePicker } from "@/components/VoicePicker";
import { UnsupportedBrowserNotice, DemoResultNotice } from "@/components/ErrorStates";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoicePreference } from "@/hooks/useVoicePreference";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/types";

export default function LiveTranslatePage() {
  const [lang1, setLang1] = useState<LanguageCode>("hi");
  const [lang2, setLang2] = useState<LanguageCode>("en");
  const [activeSpeaker, setActiveSpeaker] = useState<1 | 2>(1);
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [translated1, setTranslated1] = useState("");
  const [translated2, setTranslated2] = useState("");
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<{
    source?: "gemini" | "demo";
    reason?: string;
    connected?: boolean;
  } | null>(null);
  const tts = useSpeechSynthesis();
  const { voice } = useVoicePreference();

  const meta1 = SUPPORTED_LANGUAGES.find((l) => l.code === lang1)!;
  const meta2 = SUPPORTED_LANGUAGES.find((l) => l.code === lang2)!;

  const handleFinal = useCallback(
    async (text: string) => {
      if (!text) return;
      const speaker = activeSpeaker;
      const sourceMeta = speaker === 1 ? meta1 : meta2;
      const targetMeta = speaker === 1 ? meta2 : meta1;
      if (speaker === 1) setText1(text);
      else setText2(text);

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sourceLabel: sourceMeta.label,
            targetLabel: targetMeta.label,
            speak: true,
            voice,
          }),
        }).then((r) => r.json());

        if (speaker === 1) setTranslated1(res.text);
        else setTranslated2(res.text);

        setNotice({
          source: res.source,
          reason: res.reason ?? undefined,
          connected: res.engineConnected,
        });

        tts.speak(res.text, {
          audioBase64: res.audio?.audioBase64,
          mimeType: res.audio?.mimeType,
          lang: targetMeta.bcp47,
        });
      } catch {
        /* handled server-side with demo fallback already */
      }
    },
    [activeSpeaker, meta1, meta2, tts, voice],
  );

  const recog = useSpeechRecognition(activeSpeaker === 1 ? meta1.bcp47 : meta2.bcp47, handleFinal);

  const toggleListening = () => {
    if (listening) {
      recog.stop();
      setListening(false);
    } else {
      recog.start();
      setListening(true);
    }
  };

  const switchSpeaker = (speaker: 1 | 2) => {
    if (listening) recog.stop();
    setActiveSpeaker(speaker);
    if (listening) setTimeout(() => recog.start(), 150);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Live Translate</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Two people, two languages, one real-time conversation. Pick who is speaking and talk naturally.
        </p>
      </header>

      {!isSpeechRecognitionSupported() && <UnsupportedBrowserNotice />}

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={toggleListening} className={listening ? "m3-btn-filled" : "m3-btn-filled"}>
          {listening ? "◼ Stop" : "🎙️ Live translation active"}
        </button>
        <VoicePicker compact className="min-w-[16rem] flex-1" />
      </div>

      <div className="m3-card flex flex-wrap items-center gap-4 !rounded-[20px]">
        <LanguageSelector value={lang1} onChange={setLang1} label="Speaker 1 → Language" />
        <LanguageSelector value={lang2} onChange={setLang2} label="Speaker 2 → Language" />
      </div>

      <div className="relative flex flex-col gap-6 md:flex-row">
        <TranslationPanel
          label="Speaker 1"
          lang={lang1}
          active={activeSpeaker === 1}
          originalText={text1}
          translatedText={translated1}
          onSelect={() => switchSpeaker(1)}
        />

        <div className="hidden md:flex md:w-14 md:flex-col md:items-center md:justify-center">
          <div className="h-full w-px bg-gradient-to-b from-transparent via-[var(--md-sys-color-primary)] to-transparent" />
          <span className="my-2 text-lg">🔊</span>
          <div className="h-full w-px bg-gradient-to-b from-transparent via-[var(--md-sys-color-tertiary)] to-transparent" />
        </div>

        <TranslationPanel
          label="Speaker 2"
          lang={lang2}
          active={activeSpeaker === 2}
          originalText={text2}
          translatedText={translated2}
          onSelect={() => switchSpeaker(2)}
        />
      </div>

      {notice && (
        <DemoResultNotice
          source={notice.source}
          reason={notice.reason}
          connected={notice.connected}
          what="The translation"
        />
      )}

      {recog.interim && (
        <p className="rounded-xl border border-dashed border-[var(--md-sys-color-outline)] px-4 py-2 text-sm italic text-[var(--md-sys-color-on-surface-variant)]">
          {recog.interim}
        </p>
      )}
    </div>
  );
}
