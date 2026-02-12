import { BygImage, BygPost } from '@/types'
import { BrowseQueries } from '@/browse/queries'

export abstract class BrowseController {
  static async browsePosts(): Promise<BygPost[]> {
    console.info('Posts Loaded')
    return await BrowseQueries.getPosts()
  }

  static async getPostInfo(id: number): Promise<BygPost> {
    console.info('Getting Post Info')
    const data: BygPost[] = await BrowseQueries.getPostById(id)
    return data[0]
  }

  static async getImageInfo(id: number): Promise<BygImage> {
    console.info('Getting Image Info')
    const data: BygImage[] = await BrowseQueries.getImageById(id)
    return data[0]
  }

  static async browseImages(): Promise<BygImage[]> {
    console.info('Images Loaded')
    return await BrowseQueries.getImages()
  }
}
