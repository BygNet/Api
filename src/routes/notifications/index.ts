import { t } from 'elysia'

import { NotificationService } from '@/notifications/service'
import { NotificationsController } from '@/notifications/controller'
import { PushService } from '@/push/service'
import {
  PushSubscriptionSchema,
  PushUnsubscribeSchema,
  type PushSubscriptionBody,
  type PushUnsubscribeBody,
} from '@/schemas'
import { parseLimit, requireUser, type RouteApp } from '../helpers'

export function registerNotificationRoutes(app: RouteApp): RouteApp {
  return app
    .get(
      '/push/public-key',
      () => ({ publicKey: PushService.getPublicKey() }),
      {
        response: { 200: t.Ref('PushPublicKey') },
        detail: {
          tags: ['Notifications'],
          description: 'Get web push VAPID public key',
        },
      }
    )
    .post(
      '/push/subscribe',
      async ({ body, userId, set }) => {
        if (!requireUser(userId, set)) return null

        PushService.registerSubscription(userId, body as PushSubscriptionBody)
        return { status: 'ok' }
      },
      {
        body: PushSubscriptionSchema,
        response: {
          200: t.Ref('Status'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Notifications'],
          description:
            'Register a web push subscription for the authenticated user',
        },
      }
    )
    .post(
      '/push/unsubscribe',
      async ({ body, userId, set }) => {
        if (!requireUser(userId, set)) return null

        PushService.unregisterSubscription(
          userId,
          (body as PushUnsubscribeBody).endpoint
        )
        return { status: 'ok' }
      },
      {
        body: PushUnsubscribeSchema,
        response: {
          200: t.Ref('Status'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Notifications'],
          description:
            'Remove a web push subscription for the authenticated user',
        },
      }
    )
    .get(
      '/notifications',
      async ({ userId, query, set }) => {
        if (!requireUser(userId, set)) return null

        return await NotificationsController.getNotifications(
          userId,
          parseLimit(query.limit, 40)
        )
      },
      {
        query: t.Object({ limit: t.Optional(t.String()) }),
        response: {
          200: t.Ref('AnyArray'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Notifications'],
          description: 'Get recent notifications for the authenticated user',
        },
      }
    )
    .post(
      '/notifications/read-all',
      async ({ userId, set }) => {
        if (!requireUser(userId, set)) return null
        await NotificationService.markAllRead(userId)
        return { status: 'ok' }
      },
      {
        response: {
          200: t.Ref('Status'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Notifications'],
          description: 'Mark all notifications as read',
        },
      }
    )
}
