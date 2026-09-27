import { db } from "@/db";
import { actionItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);
  try {
    const body = (await req.json()) as { done: boolean };
    const [updated] = await db
      .update(actionItems)
      .set({ done: body.done })
      .where(eq(actionItems.id, itemId))
      .returning();
    return Response.json({ actionItem: updated });
  } catch (err) {
    return Response.json({ error: "update_failed", detail: String(err) }, { status: 500 });
  }
}
