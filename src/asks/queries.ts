import { eq, sql } from 'drizzle-orm'

import { data } from '@/data/client'
import { asks } from '@/data/tables'
import type { BygAsk } from '@/types'

type AskRow = {
  id: number
  content: string
  createdAt: Date
}

function clampLimit(limit: number): number {
  return Math.max(1, Math.min(limit, 100))
}

export abstract class AsksQueries {
  static async getUserAsks(userId: number, limit: number): Promise<BygAsk[]> {
    const rows: AskRow[] = await data
      .select({
        id: asks.id,
        content: asks.content,
        createdAt: asks.createdAt,
      })
      .from(asks)
      .where(eq(asks.recipientId, userId))
      .orderBy(sql`${asks.id} desc`)
      .limit(clampLimit(limit))

    return rows.map(row => ({
      id: row.id,
      content: row.content,
      createdDate: row.createdAt.toISOString(),
    }))
  }

  static async createAsk(
    recipientId: number,
    content: string
  ): Promise<BygAsk> {
    const rows = await data
      .insert(asks)
      .values({
        recipientId,
        content,
      })
      .returning({
        id: asks.id,
        content: asks.content,
        createdAt: asks.createdAt,
      })

    const row = rows[0]
    if (!row) {
      throw new Error('Failed to create ask')
    }

    return {
      id: row.id,
      content: row.content,
      createdDate: row.createdAt.toISOString(),
    }
  }
}
