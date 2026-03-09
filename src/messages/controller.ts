import { MessageSendBody } from '@/schemas'
import { PushService } from '@/push/service'
import type {
  BygMessage,
  BygMessageConversation,
  BygMessageShareTarget,
  BygMessageThread,
} from '@/types'

import { MessagesQueries } from './queries'
import { MessagesRealtimeService } from './realtime'

function summarizePushBody(message: BygMessage): string {
  const trimmed = message.content.trim()
  if (trimmed) {
    if (trimmed.length <= 80) return trimmed
    return `${trimmed.slice(0, 80)}…`
  }

  if (message.sharedPost) {
    return `Shared a post: ${message.sharedPost.title}`
  }

  if (message.sharedImage) {
    return `Shared an image: ${message.sharedImage.title}`
  }

  return 'Sent you a message'
}

export abstract class MessagesController {
  static async getThreads(
    userId: number,
    limit: number
  ): Promise<BygMessageThread[]> {
    return await MessagesQueries.getMessageThreads(userId, limit)
  }

  static async getConversation(
    userId: number,
    username: string,
    limit: number
  ): Promise<BygMessageConversation | null> {
    return await MessagesQueries.getConversationByUsername(
      userId,
      username,
      limit
    )
  }

  static async getShareTargets(
    userId: number,
    limit: number
  ): Promise<BygMessageShareTarget[]> {
    return await MessagesQueries.getShareTargets(userId, limit)
  }

  static async sendMessage(
    body: MessageSendBody,
    userId: number,
    set: any
  ): Promise<BygMessage | null> {
    const result = await MessagesQueries.sendMessage({
      senderId: userId,
      recipientId: body.recipientId,
      content: body.content,
      sharedPostId: body.sharedPostId,
      sharedImageId: body.sharedImageId,
    })

    if (!result.ok) {
      switch (result.code) {
        case 'cannot_message_self':
        case 'empty_message':
        case 'invalid_share_payload':
          set.status = 400
          return null

        case 'recipient_not_found':
        case 'post_not_found':
        case 'image_not_found':
          set.status = 404
          return null

        case 'save_failed':
        default:
          set.status = 500
          return null
      }
    }

    const message = result.message
    MessagesRealtimeService.broadcastMessage(message)

    if (message.recipientId !== userId) {
      await PushService.sendToUser(message.recipientId, {
        type: 'message',
        title: `New message from ${message.senderUsername}`,
        body: summarizePushBody(message),
        path: `/messages?with=${encodeURIComponent(message.senderUsername)}`,
        tag: `message-${message.id}`,
      })
    }

    return message
  }
}
