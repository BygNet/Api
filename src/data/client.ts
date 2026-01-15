import * as schema from '@/data/tables'
let data: any
export const isProd: boolean =
  process.env.NODE_ENV === 'production'

if (!isProd) {
  // SQLite (dev)
  const Database = (await import('bun:sqlite')).default
  const { drizzle: sqliteDrizzle } =
    await import('drizzle-orm/bun-sqlite')

  const sqlite = new Database('data.db')
  data = sqliteDrizzle(sqlite, { schema })
} else {
  // Postgres (prod)
  const postgres = (await import('postgres')).default
  const { drizzle: pgDrizzle } =
    await import('drizzle-orm/postgres-js')

  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: 'require',
  })
  data = pgDrizzle(sql, { schema })
}

export { data }
