import { CreateQueries } from '@/create/queries'
import { CreatePostBody, UploadImageBody } from '@/schemas'

export abstract class CreateController {
  static async createPost(
    post: CreatePostBody,
    userId: number
  ): Promise<number> {
    await CreateQueries.savePost({
      title: post.title,
      content: post.content,
      authorId: userId,
    })
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
