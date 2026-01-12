import { data } from '@/data/client'
import { images, posts } from '@/data/tables'
import { CreatePostBody, UploadImageBody } from '@/schemas'

export abstract class CreateQueries {
  static async savePost(
    post: CreatePostBody
  ): Promise<void> {
    try {
      await data.insert(posts).values({
        title: post.title,
        content: post.content,
        author: post.author,
        createdDate: new Date().toISOString(),
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  static async saveImage(
    image: UploadImageBody
  ): Promise<void> {
    try {
      await data.insert(images).values({
        title: image.title,
        imageUrl: image.imageUrl,
        author: image.author,
        createdDate: new Date().toISOString(),
      })
    } catch (e) {
      throw e
    }
  }
}
