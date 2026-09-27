import { db } from "@/db";
import { actionItems, conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversationId = Number(id);
  try {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conversation) return Response.json({ error: "not_found" }, { status: 404 });
    const items = await db.select().from(actionItems).where(eq(actionItems.conversationId, conversationId));
    return Response.json({ conversation, actionItems: items });
  } catch (err) {
    return Response.json({ error: "fetch_failed", detail: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversationId = Number(id);
  try {
    await db.delete(conversations).where(eq(conversations.id, conversationId));
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: "delete_failed", detail: String(err) }, { status: 500 });
  }
}
