import { db } from "@/db";
import { actionItems, conversations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: actionItems.id,
        task: actionItems.task,
        owner: actionItems.owner,
        deadline: actionItems.deadline,
        done: actionItems.done,
        createdAt: actionItems.createdAt,
        conversationId: actionItems.conversationId,
        conversationTitle: conversations.title,
      })
      .from(actionItems)
      .leftJoin(conversations, eq(actionItems.conversationId, conversations.id))
      .orderBy(desc(actionItems.createdAt));
    return Response.json({ actionItems: rows });
  } catch (err) {
    return Response.json({ error: "list_failed", detail: String(err) }, { status: 500 });
  }
}
