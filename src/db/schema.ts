import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export type TranscriptSegment = {
  speaker: string;
  text: string;
  timestampMs: number;
  lang?: string;
  confidence?: number;
  interrupted?: boolean;
};

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mode: text("mode").notNull(), // live-voice | live-translate | transcribe
  languages: jsonb("languages").$type<string[]>().notNull().default([]),
  participantCount: integer("participant_count").notNull().default(1),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  transcript: jsonb("transcript").$type<TranscriptSegment[]>().notNull().default([]),
  summary: text("summary").notNull().default(""),
  decisions: jsonb("decisions").$type<string[]>().notNull().default([]),
  followUps: jsonb("follow_ups").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  task: text("task").notNull(),
  owner: text("owner").notNull().default("Unassigned"),
  deadline: text("deadline").notNull().default("—"),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
