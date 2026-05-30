import { LikeQueries } from '@/like/queries'
import { BygPost } from '@/types'
import { logger } from '@/observability/logger'

export abstract class LikeController {
  static async likePost(id: number): Promise<number> {
    const post: BygPost | null = await LikeQueries.getPost(id)

    if (post) {
      await LikeQueries.likePost(id)
      logger.info('post.liked', {
        postId: id,
      })
      return 204
    } else {
      logger.warn('post.like_missing_target', {
        postId: id,
      })
      return 404
    }
  }

  static async likeImage(id: number): Promise<number> {
    const image = await LikeQueries.getImage(id)

    if (image) {
      await LikeQueries.likeImage(id)
      logger.info('image.liked', {
        imageId: id,
      })
      return 204
    } else {
      logger.warn('image.like_missing_target', {
        imageId: id,
      })
      return 404
    }
  }
}
