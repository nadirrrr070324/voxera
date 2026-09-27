import { hasGeminiKey } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ connected: hasGeminiKey() });
}
