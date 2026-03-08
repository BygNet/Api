import { CreateQueries } from '@/create/queries'
import { CreatePostBody, UploadImageBody } from '@/schemas'
import { ProfileQueries } from '@/profile/queries'
import { PushService } from '@/push/service'
import { extractMentionUsernames } from '@/utils/mentions'

function shortenText(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 80)}…`
}

export abstract class CreateController {
  static async createPost(
    post: CreatePostBody,
    userId: number
  ): Promise<number> {
    const postId = await CreateQueries.savePost({
      title: post.title,
      content: post.content,
      authorId: userId,
    })

    const actor = await ProfileQueries.getUserProfile(userId)
    if (actor) {
      const mentionTargets = await ProfileQueries.getUsersByUsernames(
        extractMentionUsernames(post.content)
      )

      await Promise.all(
        mentionTargets
          .filter(target => target.id !== userId)
          .map(target =>
            PushService.sendToUser(target.id, {
              type: 'post_mention',
              title: 'You were mentioned in a post',
              body: `${actor.username} mentioned you: ${shortenText(
                post.content
              )}`,
              path: `/details/${postId}`,
              tag: `post-mention-${postId}-${target.id}`,
            })
          )
      )
    }

    console.info('Post saved.')
    return 204
  }

  static async uploadImage(
    image: UploadImageBody,
    userId: number
  ): Promise<number> {
    await CreateQueries.saveImage({
      title: image.title,
      imageUrl: image.imageUrl,
      authorId: userId,
    })
    console.info('Image saved.')
    return 204
  }
}
