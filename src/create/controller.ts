import { CreateQueries } from '@/create/queries'
import { CreatePostBody, UploadImageBody } from '@/schemas'

export abstract class CreateController {
  static async createPost(
    post: CreatePostBody
  ): Promise<number> {
    await CreateQueries.savePost(post)
    console.info('Post saved.')
    return 204
  }

  static async uploadImage(
    image: UploadImageBody
  ): Promise<number> {
    await CreateQueries.saveImage(image)
    console.info('Image saved.')
    return 204
  }
}
