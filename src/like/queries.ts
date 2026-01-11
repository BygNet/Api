import { BygPost, BygImage, BygVideo } from '@/types'
import { data } from '@/data/client'
import { eq, sql } from 'drizzle-orm'
import { posts, images, videos } from '@/data/tables'

export abstract class LikeQueries {
  static async getPost(
    id: number
  ): Promise<BygPost | null> {
    const post: BygPost[] = await data
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    return post[0] ?? null
  }

  static async getImage(
    id: number
  ): Promise<BygImage | null> {
    const image: BygImage[] = await data
      .select()
      .from(images)
      .where(eq(images.id, id))
      .limit(1)

    return image[0] ?? null
  }

  static async getVideo(
    id: number
  ): Promise<BygVideo | null> {
    const video: BygVideo[] = await data
      .select()
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1)

    return video[0] ?? null
  }

  static async likePost(id: number): Promise<void> {
    await data
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, id))
  }

  static async likeImage(id: number): Promise<void> {
    await data
      .update(images)
      .set({ likes: sql`${images.likes} + 1` })
      .where(eq(images.id, id))
  }

  static async likeVideo(id: number): Promise<void> {
    await data
      .update(videos)
      .set({ likes: sql`${videos.likes} + 1` })
      .where(eq(videos.id, id))
  }
}
