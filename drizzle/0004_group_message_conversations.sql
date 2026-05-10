CREATE TABLE IF NOT EXISTS "message_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"title" text,
	"image_url" text,
	"description" text,
	"creator_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_conversations_type_check" CHECK ("type" in ('direct', 'group'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_conversation_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"invited_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "conversation_id" integer;
--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "recipient_id" DROP NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "message_conversations" ADD CONSTRAINT "message_conversations_type_check" CHECK ("type" in ('direct', 'group'));
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "message_conversations" ADD CONSTRAINT "message_conversations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "message_conversation_members" ADD CONSTRAINT "message_conversation_members_conversation_id_message_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."message_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "message_conversation_members" ADD CONSTRAINT "message_conversation_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "message_conversation_members" ADD CONSTRAINT "message_conversation_members_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_message_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."message_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_conversation_members_unique" ON "message_conversation_members" USING btree ("conversation_id","user_id");
--> statement-breakpoint
DO $$
DECLARE
	pair record;
	new_conversation_id integer;
BEGIN
	FOR pair IN
		SELECT DISTINCT ON (least("sender_id", "recipient_id"), greatest("sender_id", "recipient_id"))
			least("sender_id", "recipient_id") AS first_user_id,
			greatest("sender_id", "recipient_id") AS second_user_id,
			"sender_id" AS creator_id,
			"created_at" AS created_at
		FROM "messages"
		WHERE "conversation_id" IS NULL
			AND "recipient_id" IS NOT NULL
		ORDER BY
			least("sender_id", "recipient_id"),
			greatest("sender_id", "recipient_id"),
			"created_at" ASC,
			"id" ASC
	LOOP
		INSERT INTO "message_conversations" (
			"type",
			"creator_id",
			"created_at",
			"updated_at"
		)
		VALUES (
			'direct',
			pair.creator_id,
			pair.created_at,
			pair.created_at
		)
		RETURNING "id" INTO new_conversation_id;

		INSERT INTO "message_conversation_members" (
			"conversation_id",
			"user_id",
			"invited_by_id",
			"created_at"
		)
		VALUES
			(new_conversation_id, pair.first_user_id, pair.creator_id, pair.created_at),
			(new_conversation_id, pair.second_user_id, pair.creator_id, pair.created_at)
		ON CONFLICT DO NOTHING;

		UPDATE "messages"
		SET "conversation_id" = new_conversation_id
		WHERE "conversation_id" IS NULL
			AND least("sender_id", "recipient_id") = pair.first_user_id
			AND greatest("sender_id", "recipient_id") = pair.second_user_id;
	END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_conversation_members_user_id_idx" ON "message_conversation_members" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");
