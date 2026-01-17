import { data } from '@/data/client'
import { images, posts } from '@/data/tables'
import { eq, sql } from 'drizzle-orm'

export abstract class ShareQueries {
  static async augmentPostShares(
    id: number
  ): Promise<void> {
    await data
      .update(posts)
      .set({ shares: sql`${posts.shares} + 1` })
      .where(eq(posts.id, id))
  }

  static async augmentImageShares(
    id: number
  ): Promise<void> {
    await data
      .update(images)
      .set({ shares: sql`${images.shares} + 1` })
      .where(eq(images.id, id))
  }
}
