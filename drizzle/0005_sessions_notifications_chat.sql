ALTER TABLE "sessions"
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "last_used_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "sessions"
  ALTER COLUMN "expires_at" DROP NOT NULL;

ALTER TABLE "sessions"
  ADD COLUMN IF NOT EXISTS "ip_address" text,
  ADD COLUMN IF NOT EXISTS "country_code" text,
  ADD COLUMN IF NOT EXISTS "country_name" text,
  ADD COLUMN IF NOT EXISTS "user_agent" text,
  ADD COLUMN IF NOT EXISTS "device_label" text;

CREATE TABLE IF NOT EXISTS "auth_grants" (
  "code" uuid PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "redirect_uri" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz
);

ALTER TABLE "message_conversation_members"
  ADD COLUMN IF NOT EXISTS "last_read_at" timestamptz;

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "user_id" integer PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "chat_notifications_enabled" boolean NOT NULL DEFAULT true,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "recipient_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "actor_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "path" text NOT NULL,
  "dedupe_key" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "read_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "notifications_recipient_created_idx"
  ON "notifications" ("recipient_id", "created_at");
