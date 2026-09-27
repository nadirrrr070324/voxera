import { db } from "@/db";
import { hasGeminiKey } from "@/lib/gemini";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Reports per-dependency health instead of a single boolean, so a 500 explains
 * which service is at fault (missing DATABASE_URL vs. unreachable database).
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  checks.gemini = hasGeminiKey()
    ? { ok: true, detail: "GEMINI_API_KEY is configured" }
    : { ok: false, detail: "GEMINI_API_KEY is not set" };

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    checks.database = { ok: false, detail: "DATABASE_URL is not set" };
  } else {
    try {
      await db.execute(sql`select 1`);
      checks.database = { ok: true, detail: "Connected" };
    } catch (err) {
      checks.database = { ok: false, detail: String(err) };
    }
  }

  const ok = Object.values(checks).every((c) => c.ok);
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
