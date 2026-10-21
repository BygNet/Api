ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_set" boolean DEFAULT true NOT NULL;

CREATE TABLE IF NOT EXISTS "oauth_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "provider_username" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oauth_grants" (
  "code" uuid PRIMARY KEY NOT NULL,
  "provider" text NOT NULL,
  "action" text NOT NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "provider_account_id" text NOT NULL,
  "provider_username" text,
  "email" text,
  "display_name" text,
  "avatar_url" text,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "oauth_accounts_provider_account_unique" ON "oauth_accounts" USING btree ("provider","provider_account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_accounts_user_provider_unique" ON "oauth_accounts" USING btree ("user_id","provider");
CREATE INDEX IF NOT EXISTS "oauth_accounts_user_id_idx" ON "oauth_accounts" USING btree ("user_id");
