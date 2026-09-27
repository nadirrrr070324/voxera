import { generateReply, hasGeminiKey, synthesizeSpeech } from "@/lib/gemini";
import { resolveVoice } from "@/lib/voices";
import { toPlayableWavBase64 } from "@/lib/wav";
import type { ChatTurn } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { history: ChatTurn[]; voice?: string };
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const { result: text, source, reason } = await generateReply(history);
    const voice = resolveVoice(body.voice);

    let audio: { audioBase64: string; mimeType: string } | null = null;
    const tts = await synthesizeSpeech(text, voice);
    if (tts) {
      audio = toPlayableWavBase64(tts.audioBase64, tts.mimeType);
    }

    return Response.json({ text, source, reason, voice, audio, engineConnected: hasGeminiKey() });
  } catch (err) {
    return Response.json({ error: "voice_respond_failed", detail: String(err) }, { status: 500 });
  }
}
