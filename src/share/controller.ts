import { ShareQueries } from '@/share/queries'

function constructShareUrl(
  id: number,
  path: string
): string {
  return `https://${import.meta.env.BASE_URL}/${path}/${id}`
}

export abstract class ShareController {
  static sharePost(id: number): string {
    ShareQueries.augmentPostShares(id).then((): void => {})
    return constructShareUrl(id, 'details')
  }
}
