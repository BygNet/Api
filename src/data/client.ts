import Database from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import path from 'node:path'

const databasePath: string = path.resolve(
  process.cwd(),
  'data.db'
)
const database = new Database(databasePath)
export const data = drizzle(database)
