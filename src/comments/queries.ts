import { BygComment } from '@bygnet/types'
import { data } from '@/data/client'
import {
  imageComments,
  images,
  postComments,
  posts,
  users,
} from '@/data/tables'
import { eq, sql } from 'drizzle-orm'
import { expandMentionsToMarkdownLinks } from '@/utils/mentions'

type CommentRow = {
  id: number
  author: string | null
  content: string
  createdAt: Date
}

interface AddCommentResult {
  ok: boolean
  targetUserId: number | null
  commentId: number | null
}

export abstract class CommentsQueries {
  static async getPostComments(postId: number): Promise<BygComment[]> {
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
      content: expandMentionsToMarkdownLinks(row.content),
      createdDate: row.createdAt.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async getImageComments(imageId: number): Promise<BygComment[]> {
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
      content: expandMentionsToMarkdownLinks(row.content),
      createdDate: row.createdAt.toISOString(),
      author: row.author ?? 'unknown',
    }))
  }

  static async addPostComment(
    postId: number,
    authorId: number,
    content: string
  ): Promise<AddCommentResult> {
    const postRows = await data
      .select({
        authorId: posts.authorId,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
    const targetUserId = postRows[0]?.authorId ?? null
    if (targetUserId === null) {
      return { ok: false, targetUserId: null, commentId: null }
    }

    const inserted = await data.transaction(async (tx: typeof data) => {
      const rows = await tx
        .insert(postComments)
        .values({
          postId,
          authorId,
          content,
        })
        .returning({ id: postComments.id })

      await tx
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
        })
        .where(eq(posts.id, postId))

      return rows[0]?.id ?? null
    })

    return { ok: inserted !== null, targetUserId, commentId: inserted }
  }

  static async addImageComment(
    imageId: number,
    authorId: number,
    content: string
  ): Promise<AddCommentResult> {
    const imageRows = await data
      .select({
        authorId: images.authorId,
      })
      .from(images)
      .where(eq(images.id, imageId))
      .limit(1)
    const targetUserId = imageRows[0]?.authorId ?? null
    if (targetUserId === null) {
      return { ok: false, targetUserId: null, commentId: null }
    }

    const inserted = await data.transaction(async (tx: typeof data) => {
      const rows = await tx
        .insert(imageComments)
        .values({
          imageId,
          authorId,
          content,
        })
        .returning({ id: imageComments.id })

      await tx
        .update(images)
        .set({
          commentCount: sql`${images.commentCount} + 1`,
        })
        .where(eq(images.id, imageId))

      return rows[0]?.id ?? null
    })

    return { ok: inserted !== null, targetUserId, commentId: inserted }
  }
}
