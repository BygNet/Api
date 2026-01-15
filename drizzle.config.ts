import type { Config } from 'drizzle-kit'

export default {
  schema: './src/data/tables.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./data.db',
  },
} satisfies Config
