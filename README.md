# Byg API
This repo contains the API for Byg - the beautiful, unhinged, open social media.
The main Byg-hosted API is accessible [here](https://api.byg.a35.dev/).

> Terms of Service: [Here](https://byg.a35.dev/terms)

## Why Byg?
- We love ash.
- BYGger = BETter (not a reference to an upcoming online gambling service).
- I said so.
- Byg is open source under the Apache License 2.0.

## Byg Mobile
Byg Mobile for iOS is releasing soon as an open source repo.
Stay tuned!

## Local database (Postgres only)
Run a local Postgres instance:

```shell
docker run --name byg-postgres \
  -e POSTGRES_USER=byg \
  -e POSTGRES_PASSWORD=byg \
  -e POSTGRES_DB=byg \
  -p 5432:5432 \
  -d postgres:16
```

Set `.env`:

```env
DATABASE_URL="postgres://byg:byg@localhost:5432/byg"
DATABASE_SSL="disable"
```

To enable Yandex sign-in, register the API callback URL in the Yandex OAuth
application and configure the server-side credentials:

```env
YANDEX_OAUTH_CLIENT_ID="..."
YANDEX_OAUTH_CLIENT_SECRET="..."
API_PUBLIC_BASE_URL="https://api.byg.a35.dev"
```

The server-side callback URL is
`https://api.byg.a35.dev/auth/oauth/yandex/callback` unless
`YANDEX_OAUTH_REDIRECT_URI` is set explicitly. For the homepage's personalized
one-tap button, also register the web token-page URL
`https://byg.gg/oauth/yandex-token` in the Yandex application. The app requests
the Yandex ID permissions `login:info` and `login:email`.

Apply schema:

```shell
bun run db:push
```

## PostHog logs
Structured API logs are emitted locally as JSON and sent to PostHog through
OpenTelemetry when a project token is configured:

```env
POSTHOG_PROJECT_TOKEN="phc_..."
POSTHOG_LOGS_URL="https://us.i.posthog.com/i/v1/logs"
OTEL_SERVICE_NAME="byg-api"
```

Use the `phc_` project token from PostHog project settings. Do not use a
personal `phx_` API key.

## Migrating existing SQLite data to Postgres
If you have legacy local data in `data.db`, keep that file and run:

```shell
SQLITE_PATH=./data.db bun run db:migrate:sqlite
```

This copies users, sessions, posts, images, comments, follows, messages, and short links into your Postgres DB and syncs serial sequences.

## Thanks
Byg thanks to the following people and projects:
- TypeScript Language
- Bun Runtime (Buntime)
- Elysia js
- Render.com
- Dimabooboobear
- Allie
