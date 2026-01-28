import { CommentsQueries } from '@/comments/queries'
import { BygComment } from '@/types'
import { CommentBody } from '@/schemas'

export abstract class CommentsController {
  static async getPostComments(
    postId: number
  ): Promise<BygComment[]> {
    return await CommentsQueries.getPostComments(postId)
  }

  static async getImageComments(
    imageId: number
  ): Promise<BygComment[]> {
    return await CommentsQueries.getImageComments(imageId)
  }

  static async commentPost(
    body: CommentBody,
    userId: number
  ): Promise<number> {
    if (!body.content || body.content.trim() === '') {
      return 400
    }

    try {
      await CommentsQueries.addPostComment(
        body.id,
        userId,
        body.content
      )
      return 200
    } catch (e) {
      console.error(e)
      return 500
    }
  }

  static async commentImage(
    body: CommentBody,
    userId: number
  ): Promise<number> {
    if (!body.content || body.content.trim() === '') {
      return 400
    }

    try {
      await CommentsQueries.addImageComment(
        body.id,
        userId,
        body.content
      )
      return 200
    } catch (e) {
      console.error(e)
      return 500
    }
  }
}
