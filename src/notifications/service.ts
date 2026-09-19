import { and, eq } from 'drizzle-orm'

import { data } from '@/data/client'
import { notificationPreferences, notifications } from '@/data/tables'
import { MessagesRealtimeService } from '@/messages/realtime'

export type NotificationType =
  | 'follow'
  | 'post_comment'
  | 'image_comment'
  | 'post_mention'
  | 'comment_mention'
  | 'ask'
  | 'message'

export interface CreateNotificationInput {
  recipientId: number
  actorId?: number | null
  type: NotificationType
  title: string
  body: string
  path: string
  dedupeKey: string
}

export abstract class NotificationService {
  static async chatNotificationsEnabled(userId: number): Promise<boolean> {
    const preference = await data.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    })
    return preference?.chatNotificationsEnabled ?? true
  }

  static async setChatNotificationsEnabled(
    userId: number,
    enabled: boolean
  ): Promise<void> {
    await data
      .insert(notificationPreferences)
      .values({
        userId,
        chatNotificationsEnabled: enabled,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          chatNotificationsEnabled: enabled,
          updatedAt: new Date(),
        },
      })
  }

  static async create(input: CreateNotificationInput): Promise<void> {
    if (input.actorId !== null && input.actorId === input.recipientId) return

    if (
      input.type === 'message' &&
      (await this.chatNotificationsEnabled(input.recipientId))
    ) {
      return
    }

    const inserted = await data
      .insert(notifications)
      .values({
        recipientId: input.recipientId,
        actorId: input.actorId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        path: input.path,
        dedupeKey: input.dedupeKey,
      })
      .onConflictDoNothing({ target: notifications.dedupeKey })
      .returning({ id: notifications.id })

    if (inserted.length > 0) {
      MessagesRealtimeService.broadcastNotification(input.recipientId)
    }
  }

  static async markRead(userId: number, notificationId: number): Promise<void> {
    await data
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, userId)
        )
      )
  }

  static async markAllRead(userId: number): Promise<void> {
    await data
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.recipientId, userId))
  }
}
