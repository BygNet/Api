import { BygImage, BygPost, BygVideo } from '@/types'
import { data } from '@/data/client'
import { images, posts, videos } from '@/data/tables'
import { sql } from 'drizzle-orm'

export abstract class BrowseQueries {
  static getPosts(): Promise<BygPost[]> {
    return data
      .select()
      .from(posts)
      .limit(100)
      .orderBy(sql`${posts.id} desc`)
  }

  static getImages(): Promise<BygImage[]> {
    return data
      .select()
      .from(images)
      .limit(100)
      .orderBy(sql`${images.id} desc`)
  }

  static getVideos(): Promise<BygVideo[]> {
    return data
      .select()
      .from(videos)
      .limit(100)
      .orderBy(sql`${videos.id} desc`)
  }
}
