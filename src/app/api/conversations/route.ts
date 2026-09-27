import { db } from "@/db";
import { actionItems, conversations } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { TranscriptSegment } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
    return Response.json({ conversations: rows });
  } catch (err) {
    return Response.json({ error: "list_failed", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title: string;
      mode: string;
      languages?: string[];
      participantCount?: number;
      durationSeconds?: number;
      transcript?: TranscriptSegment[];
      summary?: string;
      decisions?: string[];
      followUps?: string[];
      actionItems?: { task: string; owner: string; deadline: string }[];
    };

    if (!body.title || !body.mode) {
      return Response.json({ error: "missing_fields" }, { status: 400 });
    }

    const [created] = await db
      .insert(conversations)
      .values({
        title: body.title,
        mode: body.mode,
        languages: body.languages ?? [],
        participantCount: body.participantCount ?? 1,
        durationSeconds: body.durationSeconds ?? 0,
        transcript: body.transcript ?? [],
        summary: body.summary ?? "",
        decisions: body.decisions ?? [],
        followUps: body.followUps ?? [],
      })
      .returning();

    if (body.actionItems?.length) {
      await db.insert(actionItems).values(
        body.actionItems.map((a) => ({
          conversationId: created.id,
          task: a.task,
          owner: a.owner,
          deadline: a.deadline,
        })),
      );
    }

    return Response.json({ conversation: created }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "create_failed", detail: String(err) }, { status: 500 });
  }
}
