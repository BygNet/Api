CREATE TABLE IF NOT EXISTS "short_links" (
	"slug" text PRIMARY KEY NOT NULL,
	"destination_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_code" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "2fa_secret" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pronouns" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "song_link_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "color" text;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'users_id_seq') THEN
		CREATE SEQUENCE "users_id_seq";
	END IF;
	ALTER SEQUENCE "users_id_seq" OWNED BY "users"."id";
	ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('users_id_seq');
	PERFORM setval('users_id_seq', COALESCE((SELECT MAX("id") FROM "users"), 1), COALESCE((SELECT MAX("id") FROM "users"), 0) > 0);
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'posts_id_seq') THEN
		CREATE SEQUENCE "posts_id_seq";
	END IF;
	ALTER SEQUENCE "posts_id_seq" OWNED BY "posts"."id";
	ALTER TABLE "posts" ALTER COLUMN "id" SET DEFAULT nextval('posts_id_seq');
	PERFORM setval('posts_id_seq', COALESCE((SELECT MAX("id") FROM "posts"), 1), COALESCE((SELECT MAX("id") FROM "posts"), 0) > 0);
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'images_id_seq') THEN
		CREATE SEQUENCE "images_id_seq";
	END IF;
	ALTER SEQUENCE "images_id_seq" OWNED BY "images"."id";
	ALTER TABLE "images" ALTER COLUMN "id" SET DEFAULT nextval('images_id_seq');
	PERFORM setval('images_id_seq', COALESCE((SELECT MAX("id") FROM "images"), 1), COALESCE((SELECT MAX("id") FROM "images"), 0) > 0);
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'post_comments_id_seq') THEN
		CREATE SEQUENCE "post_comments_id_seq";
	END IF;
	ALTER SEQUENCE "post_comments_id_seq" OWNED BY "post_comments"."id";
	ALTER TABLE "post_comments" ALTER COLUMN "id" SET DEFAULT nextval('post_comments_id_seq');
	PERFORM setval('post_comments_id_seq', COALESCE((SELECT MAX("id") FROM "post_comments"), 1), COALESCE((SELECT MAX("id") FROM "post_comments"), 0) > 0);
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'image_comments_id_seq') THEN
		CREATE SEQUENCE "image_comments_id_seq";
	END IF;
	ALTER SEQUENCE "image_comments_id_seq" OWNED BY "image_comments"."id";
	ALTER TABLE "image_comments" ALTER COLUMN "id" SET DEFAULT nextval('image_comments_id_seq');
	PERFORM setval('image_comments_id_seq', COALESCE((SELECT MAX("id") FROM "image_comments"), 1), COALESCE((SELECT MAX("id") FROM "image_comments"), 0) > 0);
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'followings_id_seq') THEN
		CREATE SEQUENCE "followings_id_seq";
	END IF;
	ALTER SEQUENCE "followings_id_seq" OWNED BY "followings"."id";
	ALTER TABLE "followings" ALTER COLUMN "id" SET DEFAULT nextval('followings_id_seq');
	PERFORM setval('followings_id_seq', COALESCE((SELECT MAX("id") FROM "followings"), 1), COALESCE((SELECT MAX("id") FROM "followings"), 0) > 0);
END $$;
--> statement-breakpoint
DO $$ BEGIN
	PERFORM setval(
		pg_get_serial_sequence('messages', 'id'),
		COALESCE((SELECT MAX("id") FROM "messages"), 1),
		COALESCE((SELECT MAX("id") FROM "messages"), 0) > 0
	);
END $$;
