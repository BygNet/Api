import { desc, eq, type InferSelectModel } from 'drizzle-orm'

import { data } from '@/data/client'
import { notifications, users } from '@/data/tables'
import type { BygNotification } from '@/types'

type NotificationRow = InferSelectModel<typeof notifications>

export abstract class NotificationsQueries {
  static async getRecentNotifications(
    userId: number,
    limit: number
  ): Promise<BygNotification[]> {
    const rows = await data
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        path: notifications.path,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
        actorUsername: users.username,
        actorAvatarUrl: users.avatarUrl,
        actorSubscriptionState: users.subscriptionState,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(Math.max(1, Math.min(limit, 100)))

    return rows.map(
      (
        row: Pick<
          NotificationRow,
          'id' | 'type' | 'body' | 'path' | 'createdAt' | 'readAt'
        > & {
          title: string
          actorUsername: string | null
          actorAvatarUrl: string | null
          actorSubscriptionState: string | null
        }
      ) => ({
        id: String(row.id),
        type: row.type as BygNotification['type'],
        actorUsername: row.actorUsername ?? 'byg',
        actorAvatarUrl: row.actorAvatarUrl,
        actorSubscriptionState: row.actorSubscriptionState ?? 'free',
        text: row.body,
        path: row.path,
        createdDate: row.createdAt.toISOString(),
        readAt: row.readAt?.toISOString() ?? null,
        title: row.title,
      })
    )
  }
}
