import { LikeQueries } from '@/like/queries'
import { BygPost } from '@/types'

export abstract class LikeController {
  static async likePost(id: number): Promise<number> {
    console.info(`Liking post ${id}`)

    const post: BygPost | null = await LikeQueries.getPost(id)

    if (post) {
      await LikeQueries.likePost(id)
      return 204
    } else {
      console.error(`Post ${id} not found`)
      return 404
    }
  }

  static async likeImage(id: number): Promise<number> {
    console.info(`Liking image ${id}`)

    const image = await LikeQueries.getImage(id)

    if (image) {
      await LikeQueries.likeImage(id)
      return 204
    } else {
      console.error(`Image ${id} not found`)
      return 404
    }
  }
}
