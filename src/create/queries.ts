import { data } from '@/data/client'
import { images, posts } from '@/data/tables'

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
    } catch (e) {
      console.error(e)
      throw e
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
    } catch (e) {
      throw e
    }
  }
}
