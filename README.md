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

Apply schema:

```shell
bun run db:push
```

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
