import { NotificationsQueries } from '@/notifications/queries'
import { BygNotification } from '@/types'

export abstract class NotificationsController {
  static async getNotifications(
    userId: number,
    limit = 40
  ): Promise<BygNotification[]> {
    return await NotificationsQueries.getRecentNotifications(userId, limit)
  }
}
