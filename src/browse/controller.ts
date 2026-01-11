import { BygImage, BygPost, BygVideo } from '@/types'
import { BrowseQueries } from '@/browse/queries'

export abstract class BrowseController {
  static async browsePosts(): Promise<BygPost[]> {
    console.info('Posts Loaded')
    return await BrowseQueries.getPosts()
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
