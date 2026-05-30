import { data } from '@/data/client'
import { images, posts } from '@/data/tables'
import { logger } from '@/observability/logger'

export abstract class CreateQueries {
  static async savePost(post: {
    title: string
    content: string
    authorId: number
  }): Promise<number> {
    try {
      const result = await data
        .insert(posts)
        .values({
          title: post.title,
          content: post.content,
          authorId: post.authorId,
          createdAt: new Date(),
        })
        .returning({
          id: posts.id,
        })

      const postId = result[0]?.id
      if (!postId) {
        throw new Error('Failed to resolve created post ID')
      }

      return postId
    } catch (error) {
      logger.error('post.create_query_failed', error, {
        authorId: post.authorId,
      })
      throw error
    }
  }

  static async saveImage(image: {
    title: string
    imageUrl: string
    authorId: number
  }): Promise<void> {
    try {
      await data.insert(images).values({
        title: image.title,
        imageUrl: image.imageUrl,
        authorId: image.authorId,
        createdAt: new Date(),
      })
    } catch (error) {
      logger.error('image.create_query_failed', error, {
        authorId: image.authorId,
      })
      throw error
    }
  }
}
