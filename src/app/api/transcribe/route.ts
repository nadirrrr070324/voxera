import { transcribeAudio, hasGeminiKey } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { audioBase64?: string; mimeType?: string };
    if (!body.audioBase64 || !body.mimeType) {
      return Response.json({ error: "missing_audio" }, { status: 400 });
    }
    const { result, source, reason } = await transcribeAudio(body.audioBase64, body.mimeType);
    return Response.json({ result, source, reason, engineConnected: hasGeminiKey() });
  } catch (err) {
    return Response.json({ error: "transcribe_failed", detail: String(err) }, { status: 500 });
  }
}
