import { BygImage, BygPost } from '@/types'
import { data } from '@/data/client'
import { images, posts, users } from '@/data/tables'
import { eq, sql } from 'drizzle-orm'

type PostRow = {
  id: number
  title: string
  content: string
  createdDate: Date
  author: string | null
  likes: number
  shares: number
  commentCount: number
}

type ImageRow = {
  id: number
  title: string
  imageUrl: string
  createdDate: Date
  author: string | null
  likes: number
  shares: number
  commentCount: number
}

export abstract class BrowseQueries {
  static async getPosts(): Promise<BygPost[]> {
    const rows: PostRow[] = await data
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdDate: posts.createdAt,
        author: users.username,
        likes: posts.likes,
        shares: posts.shares,
        commentCount: posts.commentCount,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(sql`${posts.id} desc`)
      .limit(100)

    return rows.map(row => ({
      ...row,
      createdDate: row.createdDate.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async getPostById(id: number): Promise<BygPost[]> {
    const rows: PostRow[] = await data
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdDate: posts.createdAt,
        author: users.username,
        likes: posts.likes,
        shares: posts.shares,
        commentCount: posts.commentCount,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1)

    return rows.map(row => ({
      ...row,
      createdDate: row.createdDate.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async getImages(): Promise<BygImage[]> {
    const rows: ImageRow[] = await data
      .select({
        id: images.id,
        title: images.title,
        imageUrl: images.imageUrl,
        createdDate: images.createdAt,
        author: users.username,
        likes: images.likes,
        shares: images.shares,
        commentCount: images.commentCount,
      })
      .from(images)
      .leftJoin(users, eq(images.authorId, users.id))
      .orderBy(sql`${images.id} desc`)
      .limit(100)

    return rows.map(row => ({
      ...row,
      createdDate: row.createdDate.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async getImageById(
    id: number
  ): Promise<BygImage[]> {
    const rows: ImageRow[] = await data
      .select({
        id: images.id,
        title: images.title,
        imageUrl: images.imageUrl,
        createdDate: images.createdAt,
        author: users.username,
        likes: images.likes,
        shares: images.shares,
        commentCount: images.commentCount,
      })
      .from(images)
      .leftJoin(users, eq(images.authorId, users.id))
      .where(eq(images.id, id))
      .limit(1)

    return rows.map(row => ({
      ...row,
      createdDate: row.createdDate.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }
}
