import { t } from 'elysia'

import { MessagesController } from '@/messages/controller'
import { MessagesRealtimeService } from '@/messages/realtime'
import {
  MessageConversationInfoSchema,
  MessageConversationInviteSchema,
  MessageDirectConversationSchema,
  MessageGroupConversationSchema,
  MessageReadSchema,
  MessageSendSchema,
  type MessageSendBody,
} from '@/schemas'
import {
  parseLimit,
  parseRouteId,
  requireUser,
  type RouteApp,
} from '../helpers'

export function registerMessageRoutes(app: RouteApp): RouteApp {
  return app
    .get(
      '/messages/threads',
      async ({ userId, query, set }) => {
        if (!requireUser(userId, set)) return null

        return await MessagesController.getThreads(
          userId,
          parseLimit(query.limit, 24)
        )
      },
      {
        query: t.Object({ limit: t.Optional(t.String()) }),
        response: {
          200: t.Ref('AnyArray'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Get recent message threads for the authenticated user',
        },
      }
    )
    .get(
      '/messages/conversations/:conversationId',
      async ({ userId, params, query, set }) => {
        if (!requireUser(userId, set)) return null

        const conversationId = parseRouteId(params.conversationId)
        if (conversationId === null) {
          set.status = 400
          return null
        }

        const rawAfter = query.after ? Number(query.after) : undefined
        const afterMessageId =
          rawAfter !== undefined && Number.isFinite(rawAfter)
            ? Math.trunc(rawAfter)
            : undefined
        const rawBefore = query.before ? Number(query.before) : undefined
        const beforeMessageId =
          rawBefore !== undefined && Number.isFinite(rawBefore)
            ? Math.trunc(rawBefore)
            : undefined
        const conversation = await MessagesController.getConversation(
          userId,
          conversationId,
          parseLimit(query.limit, 40),
          afterMessageId,
          beforeMessageId
        )

        if (!conversation) {
          set.status = 404
          return null
        }

        return conversation
      },
      {
        query: t.Object({
          limit: t.Optional(t.String()),
          after: t.Optional(t.String()),
          before: t.Optional(t.String()),
        }),
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Get conversation messages by conversation id',
        },
      }
    )
    .post(
      '/messages/conversations/:conversationId/read',
      async ({ body, userId, params, set }) => {
        if (!requireUser(userId, set)) return null

        const conversationId = parseRouteId(params.conversationId)
        if (conversationId === null) {
          set.status = 400
          return null
        }
        return await MessagesController.markConversationRead(
          userId,
          conversationId,
          body?.messageId,
          set
        )
      },
      {
        response: {
          200: t.Ref('Status'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
        },
        body: t.Optional(MessageReadSchema),
        detail: {
          tags: ['Messages'],
          description: 'Mark a conversation as read',
        },
      }
    )
    .get(
      '/messages/conversation/:username',
      async ({ userId, params, query, set }) => {
        if (!requireUser(userId, set)) return null

        const conversation = await MessagesController.getConversationByUsername(
          userId,
          params.username,
          parseLimit(query.limit, 120)
        )

        if (!conversation) {
          set.status = 404
          return null
        }

        return conversation
      },
      {
        query: t.Object({ limit: t.Optional(t.String()) }),
        response: {
          200: t.Ref('Any'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description:
            'Get or preview a direct conversation with another user by username',
        },
      }
    )
    .post(
      '/messages/conversations/direct',
      async ({ body, userId, set }) => {
        if (!requireUser(userId, set)) return null
        return await MessagesController.getOrCreateDirectConversation(
          body,
          userId,
          set
        )
      },
      {
        body: MessageDirectConversationSchema,
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          403: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Get or create a direct message conversation',
        },
      }
    )
    .post(
      '/messages/conversations/group',
      async ({ body, userId, set }) => {
        if (!requireUser(userId, set)) return null
        return await MessagesController.createGroupConversation(
          body,
          userId,
          set
        )
      },
      {
        body: MessageGroupConversationSchema,
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          403: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Create a group conversation',
        },
      }
    )
    .post(
      '/messages/conversations/:conversationId/members',
      async ({ body, userId, params, set }) => {
        if (!requireUser(userId, set)) return null

        const conversationId = parseRouteId(params.conversationId)
        if (conversationId === null) {
          set.status = 400
          return null
        }

        return await MessagesController.inviteGroupMember(
          conversationId,
          body,
          userId,
          set
        )
      },
      {
        body: MessageConversationInviteSchema,
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          403: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Invite a member to a group conversation as the creator',
        },
      }
    )
    .delete(
      '/messages/conversations/:conversationId/members/:memberUserId',
      async ({ userId, params, set }) => {
        if (!requireUser(userId, set)) return null

        const conversationId = parseRouteId(params.conversationId)
        const memberUserId = parseRouteId(params.memberUserId)
        if (conversationId === null || memberUserId === null) {
          set.status = 400
          return null
        }

        return await MessagesController.removeGroupMember(
          conversationId,
          memberUserId,
          userId,
          set
        )
      },
      {
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          403: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description:
            'Remove a member from a group conversation as the creator',
        },
      }
    )
    .patch(
      '/messages/conversations/:conversationId',
      async ({ body, userId, params, set }) => {
        if (!requireUser(userId, set)) return null

        const conversationId = parseRouteId(params.conversationId)
        if (conversationId === null) {
          set.status = 400
          return null
        }

        return await MessagesController.updateGroupInfo(
          conversationId,
          body,
          userId,
          set
        )
      },
      {
        body: MessageConversationInfoSchema,
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          403: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description:
            'Update group conversation name and title as the creator',
        },
      }
    )
    .get(
      '/messages/share-targets',
      async ({ userId, query, set }) => {
        if (!requireUser(userId, set)) return null

        return await MessagesController.getShareTargets(
          userId,
          parseLimit(query.limit, 24)
        )
      },
      {
        query: t.Object({ limit: t.Optional(t.String()) }),
        response: {
          200: t.Ref('AnyArray'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Get recently contacted and followed users for sharing',
        },
      }
    )
    .post(
      '/messages/send',
      async ({ body, userId, set }) => {
        if (!requireUser(userId, set)) return null

        const message = await MessagesController.sendMessage(
          body as MessageSendBody,
          userId,
          set
        )
        return message ?? null
      },
      {
        body: MessageSendSchema,
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          403: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Messages'],
          description: 'Send a message to a conversation or direct recipient',
        },
      }
    )
    .ws('/messages/live', {
      open(ws: any) {
        MessagesRealtimeService.handleOpen(ws)
      },
      async message(ws: any, message: any) {
        await MessagesRealtimeService.handleMessage(ws, message)
      },
      close(ws: any) {
        MessagesRealtimeService.handleClose(ws)
      },
    })
}
