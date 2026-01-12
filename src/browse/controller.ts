import { BygImage, BygPost, BygVideo } from '@/types'
import { BrowseQueries } from '@/browse/queries'

export abstract class BrowseController {
  static async browsePosts(): Promise<BygPost[]> {
    console.info('Posts Loaded')
    return await BrowseQueries.getPosts()
  }

  static async getPostInfo(id: number): Promise<BygPost> {
    console.info('Getting Post Info')
    const data = await BrowseQueries.getPostById(id)
    return data[0]
  }

  static async browseImages(): Promise<BygImage[]> {
    console.info('Images Loaded')
    return await BrowseQueries.getImages()
  }

  static async browseVideos(): Promise<BygVideo[]> {
    console.info('Videos Loaded')
    return await BrowseQueries.getVideos()
  }
}
