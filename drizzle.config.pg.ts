import type { Config } from 'drizzle-kit'

export default {
  schema: './src/data/tables.pg.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
