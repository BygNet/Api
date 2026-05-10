import {
  MessageConversationInfoBody,
  MessageConversationInviteBody,
  MessageDirectConversationBody,
  MessageGroupConversationBody,
  MessageSendBody,
} from '@/schemas'
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
    conversationId: number,
    limit: number
  ): Promise<BygMessageConversation | null> {
    return await MessagesQueries.getConversationById(
      userId,
      conversationId,
      limit
    )
  }

  static async getConversationByUsername(
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

  static async getOrCreateDirectConversation(
    body: MessageDirectConversationBody,
    userId: number,
    set: any
  ): Promise<BygMessageConversation | null> {
    const result = await MessagesQueries.getOrCreateDirectConversation(
      userId,
      body.recipientId
    )

    return this.handleConversationMutation(result, set)
  }

  static async createGroupConversation(
    body: MessageGroupConversationBody,
    userId: number,
    set: any
  ): Promise<BygMessageConversation | null> {
    const result = await MessagesQueries.createGroupConversation({
      creatorId: userId,
      name: body.name,
      title: body.title,
      imageUrl: body.imageUrl,
      description: body.description,
      memberIds: body.memberIds,
    })

    return this.handleConversationMutation(result, set)
  }

  static async inviteGroupMember(
    conversationId: number,
    body: MessageConversationInviteBody,
    userId: number,
    set: any
  ): Promise<BygMessageConversation | null> {
    const result = await MessagesQueries.inviteGroupMember({
      conversationId,
      actorId: userId,
      userId: body.userId,
    })

    return this.handleConversationMutation(result, set)
  }

  static async updateGroupInfo(
    conversationId: number,
    body: MessageConversationInfoBody,
    userId: number,
    set: any
  ): Promise<BygMessageConversation | null> {
    const result = await MessagesQueries.updateGroupInfo({
      conversationId,
      actorId: userId,
      name: body.name,
      title: body.title,
      imageUrl: body.imageUrl,
      description: body.description,
    })

    return this.handleConversationMutation(result, set)
  }

  static async removeGroupMember(
    conversationId: number,
    memberUserId: number,
    userId: number,
    set: any
  ): Promise<BygMessageConversation | null> {
    const result = await MessagesQueries.removeGroupMember({
      conversationId,
      actorId: userId,
      userId: memberUserId,
    })

    return this.handleConversationMutation(result, set)
  }

  static async sendMessage(
    body: MessageSendBody,
    userId: number,
    set: any
  ): Promise<BygMessage | null> {
    const result = await MessagesQueries.sendMessage({
      senderId: userId,
      conversationId: body.conversationId,
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
        case 'invalid_conversation_target':
          set.status = 400
          return null

        case 'recipient_not_found':
        case 'post_not_found':
        case 'image_not_found':
        case 'conversation_not_found':
          set.status = 404
          return null

        case 'not_conversation_member':
          set.status = 403
          return null

        case 'save_failed':
        default:
          set.status = 500
          return null
      }
    }

    const message = result.message
    MessagesRealtimeService.broadcastMessage(message, result.memberIds)

    for (const memberId of result.memberIds) {
      if (memberId === userId) continue

      await PushService.sendToUser(memberId, {
        type: 'message',
        title: `New message from ${message.senderUsername}`,
        body: summarizePushBody(message),
        path: `/messages?conversation=${message.conversationId}`,
        tag: `message-${message.id}`,
      })
    }

    return message
  }

  private static handleConversationMutation(
    result: Awaited<
      ReturnType<
        | typeof MessagesQueries.getOrCreateDirectConversation
        | typeof MessagesQueries.createGroupConversation
        | typeof MessagesQueries.inviteGroupMember
        | typeof MessagesQueries.updateGroupInfo
        | typeof MessagesQueries.removeGroupMember
      >
    >,
    set: any
  ): BygMessageConversation | null {
    if (result.ok) {
      return result.conversation
    }

    switch (result.code) {
      case 'cannot_message_self':
      case 'empty_group':
      case 'not_group_conversation':
        set.status = 400
        return null

      case 'not_conversation_member':
      case 'not_conversation_creator':
        set.status = 403
        return null

      case 'recipient_not_found':
      case 'conversation_not_found':
        set.status = 404
        return null

      case 'save_failed':
      default:
        set.status = 500
        return null
    }
  }
}
