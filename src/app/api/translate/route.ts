import { hasGeminiKey, synthesizeSpeech, translateText } from "@/lib/gemini";
import { toPlayableWavBase64 } from "@/lib/wav";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text: string;
      sourceLabel: string;
      targetLabel: string;
      speak?: boolean;
      voice?: string;
    };
    if (!body.text?.trim()) {
      return Response.json({ error: "missing_text" }, { status: 400 });
    }
    const { result: text, source, reason } = await translateText(
      body.text,
      body.sourceLabel,
      body.targetLabel,
    );

    let audio: { audioBase64: string; mimeType: string } | null = null;
    if (body.speak) {
      const tts = await synthesizeSpeech(text, body.voice);
      if (tts) audio = toPlayableWavBase64(tts.audioBase64, tts.mimeType);
    }

    return Response.json({ text, source, reason, audio, engineConnected: hasGeminiKey() });
  } catch (err) {
    return Response.json({ error: "translate_failed", detail: String(err) }, { status: 500 });
  }
}
