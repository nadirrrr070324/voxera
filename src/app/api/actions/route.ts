import { extractActions, hasGeminiKey } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { transcript?: string };
    if (!body.transcript?.trim()) {
      return Response.json({ error: "missing_transcript" }, { status: 400 });
    }
    const { result, source, reason } = await extractActions(body.transcript);
    return Response.json({ result, source, reason, engineConnected: hasGeminiKey() });
  } catch (err) {
    return Response.json({ error: "actions_failed", detail: String(err) }, { status: 500 });
  }
}
