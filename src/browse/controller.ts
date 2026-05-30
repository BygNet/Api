import { BygImage, BygPost } from '@/types'
import { BrowseQueries } from '@/browse/queries'
import { logger } from '@/observability/logger'

export abstract class BrowseController {
  static async browsePosts(): Promise<BygPost[]> {
    const posts = await BrowseQueries.getPosts()
    logger.info('posts.loaded', {
      count: posts.length,
    })
    return posts
  }

  static async getPostInfo(id: number): Promise<BygPost> {
    const data: BygPost[] = await BrowseQueries.getPostById(id)
    logger.info('post.loaded', {
      postId: id,
      found: data.length > 0,
    })
    return data[0]
  }

  static async browseImages(): Promise<BygImage[]> {
    const images = await BrowseQueries.getImages()
    logger.info('images.loaded', {
      count: images.length,
    })
    return images
  }

  static async getImageInfo(id: number): Promise<BygImage> {
    const data: BygImage[] = await BrowseQueries.getImageById(id)
    logger.info('image.loaded', {
      imageId: id,
      found: data.length > 0,
    })
    return data[0]
  }

  static async getPostsByUsername(username: string): Promise<BygPost[]> {
    return await BrowseQueries.getPostsByUsername(username)
  }

  static async getImagesByUsername(username: string): Promise<BygImage[]> {
    return await BrowseQueries.getImagesByUsername(username)
  }
}
