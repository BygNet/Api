import { BygComment } from '@/types'
import { data } from '@/data/client'
import {
  imageComments,
  images,
  postComments,
  posts,
  users,
} from '@/data/tables'
import { eq, sql } from 'drizzle-orm'

type CommentRow = {
  id: number
  author: string | null
  content: string
  createdAt: Date
}

export abstract class CommentsQueries {
  static async getPostComments(
    postId: number
  ): Promise<BygComment[]> {
    const rows: CommentRow[] = await data
      .select({
        id: postComments.id,
        author: users.username,
        content: postComments.content,
        createdAt: postComments.createdAt,
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.authorId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(sql`${postComments.id} desc`)

    return rows.map(row => ({
      ...row,
      createdDate: row.createdAt.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async getImageComments(
    imageId: number
  ): Promise<BygComment[]> {
    const rows: CommentRow[] = await data
      .select({
        id: imageComments.id,
        author: users.username,
        content: imageComments.content,
        createdAt: imageComments.createdAt,
      })
      .from(imageComments)
      .leftJoin(users, eq(imageComments.authorId, users.id))
      .where(eq(imageComments.imageId, imageId))
      .orderBy(sql`${imageComments.id} desc`)

    return rows.map(row => ({
      ...row,
      createdDate: row.createdAt.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async addPostComment(
    postId: number,
    authorId: number,
    content: string
  ): Promise<void> {
    await data.transaction(async (tx: typeof data) => {
      await tx.insert(postComments).values({
        postId,
        authorId,
        content,
      })

      await tx
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
        })
        .where(eq(posts.id, postId))
    })
  }

  static async addImageComment(
    imageId: number,
    authorId: number,
    content: string
  ): Promise<void> {
    await data.transaction(async (tx: typeof data) => {
      await tx.insert(imageComments).values({
        imageId,
        authorId,
        content,
      })

      await tx
        .update(images)
        .set({
          commentCount: sql`${images.commentCount} + 1`,
        })
        .where(eq(images.id, imageId))
    })
  }
}
