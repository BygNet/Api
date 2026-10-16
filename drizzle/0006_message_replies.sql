ALTER TABLE "messages"
  ADD COLUMN IF NOT EXISTS "reply_to_message_id" integer
  REFERENCES "messages"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "messages_conversation_cursor_idx"
  ON "messages" ("conversation_id", "id");

CREATE INDEX IF NOT EXISTS "messages_reply_to_message_id_idx"
  ON "messages" ("reply_to_message_id");
