import * as schema from '@/data/tables'
import postgres from 'postgres'
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js'

export const isProd: boolean = process.env.NODE_ENV === 'production'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const databaseSslMode = process.env.DATABASE_SSL?.trim().toLowerCase()
const shouldUseSsl =
  databaseSslMode === 'require' ||
  databaseSslMode === 'true' ||
  (databaseSslMode !== 'disable' &&
    databaseSslMode !== 'false' &&
    isProd)

const sql = postgres(databaseUrl, {
  ssl: shouldUseSsl ? 'require' : false,
})

export const data: any = pgDrizzle(sql, { schema })
