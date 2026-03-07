import { CommentsQueries } from '@/comments/queries'
import { BygComment } from '@bygnet/types'
import { CommentBody } from '@/schemas'
import { ProfileQueries } from '@/profile/queries'
import { PushService } from '@/push/service'

function shortenComment(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 80)}…`
}

export abstract class CommentsController {
  static async getPostComments(postId: number): Promise<BygComment[]> {
    return await CommentsQueries.getPostComments(postId)
  }

  static async getImageComments(imageId: number): Promise<BygComment[]> {
    return await CommentsQueries.getImageComments(imageId)
  }

  static async commentPost(body: CommentBody, userId: number): Promise<number> {
    if (!body.content || body.content.trim() === '') {
      return 400
    }

    try {
      const result = await CommentsQueries.addPostComment(
        body.id,
        userId,
        body.content
      )

      if (result.targetUserId && result.targetUserId !== userId) {
        const actor = await ProfileQueries.getUserProfile(userId)
        if (actor) {
          await PushService.sendToUser(result.targetUserId, {
            type: 'post_comment',
            title: 'New comment on your post',
            body: `${actor.username}: ${shortenComment(body.content)}`,
            path: `/details/${body.id}`,
            tag: `post-comment-${body.id}`,
          })
        }
      }

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
      const result = await CommentsQueries.addImageComment(
        body.id,
        userId,
        body.content
      )

      if (result.targetUserId && result.targetUserId !== userId) {
        const actor = await ProfileQueries.getUserProfile(userId)
        if (actor) {
          await PushService.sendToUser(result.targetUserId, {
            type: 'image_comment',
            title: 'New comment on your image',
            body: `${actor.username}: ${shortenComment(body.content)}`,
            path: `/image/${body.id}`,
            tag: `image-comment-${body.id}`,
          })
        }
      }

      return 200
    } catch (e) {
      console.error(e)
      return 500
    }
  }
}
