import { and, eq, inArray, or, sql } from 'drizzle-orm'

import { data } from '@/data/client'
import {
  followings,
  images,
  messageConversationMembers,
  messageConversations,
  messages,
  posts,
  users,
} from '@/data/tables'
import { ShareQueries } from '@/share/queries'
import type {
  BygMessage,
  BygMessageConversation,
  BygMessageConversationMember,
  BygMessageShareTarget,
  BygMessageSharedImage,
  BygMessageSharedPost,
  BygMessageThread,
} from '@/types'
import { expandMentionsToMarkdownLinks } from '@/utils/mentions'

type ConversationType = 'direct' | 'group'

type MessageRow = {
  id: number
  conversationId: number
  senderId: number
  recipientId: number | null
  content: string
  sharedPostId: number | null
  sharedImageId: number | null
  createdAt: Date
}

type ConversationRow = {
  id: number
  type: ConversationType
  name: string | null
  title: string | null
  imageUrl: string | null
  description: string | null
  creatorId: number
  createdAt: Date
}

interface UserMeta {
  id: number
  username: string
  avatarUrl: string | null
  subscriptionState: string
}

export type SendMessageErrorCode =
  | 'cannot_message_self'
  | 'empty_message'
  | 'invalid_share_payload'
  | 'invalid_conversation_target'
  | 'recipient_not_found'
  | 'conversation_not_found'
  | 'not_conversation_member'
  | 'post_not_found'
  | 'image_not_found'
  | 'save_failed'

export type ConversationMutationErrorCode =
  | 'cannot_message_self'
  | 'empty_group'
  | 'recipient_not_found'
  | 'conversation_not_found'
  | 'not_conversation_member'
  | 'not_conversation_creator'
  | 'not_group_conversation'
  | 'save_failed'

export type SendMessageResult =
  | {
      ok: true
      message: BygMessage
      memberIds: number[]
    }
  | {
      ok: false
      code: SendMessageErrorCode
    }

export type ConversationMutationResult =
  | {
      ok: true
      conversation: BygMessageConversation
    }
  | {
      ok: false
      code: ConversationMutationErrorCode
    }

interface SendMessageInput {
  senderId: number
  conversationId?: number
  recipientId?: number
  content?: string
  sharedPostId?: number
  sharedImageId?: number
}

function normalizeSubscription(state: string | null | undefined): string {
  return state ?? 'free'
}

function toIso(value: Date): string {
  return new Date(value).toISOString()
}

function clampLimit(
  value: number,
  min: number,
  max: number,
  fallback: number
): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, value))
}

function uniqueIds(values: number[]): number[] {
  return [...new Set(values)]
}

function normalizeNullableText(
  value: string | null | undefined
): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function previewMessage(
  content: string,
  hasSharedPost: boolean,
  hasSharedImage: boolean
): string {
  const trimmed = content.trim()
  if (trimmed) {
    return trimmed.length <= 80 ? trimmed : `${trimmed.slice(0, 80)}...`
  }

  if (hasSharedPost) return 'Shared a post'
  if (hasSharedImage) return 'Shared an image'
  return 'Sent a message'
}

function mapMessageRows(
  rows: MessageRow[],
  usersById: Map<number, UserMeta>,
  sharedPosts: Map<number, BygMessageSharedPost>,
  sharedImages: Map<number, BygMessageSharedImage>
): BygMessage[] {
  return rows.map(row => {
    const sender = usersById.get(row.senderId)
    const recipient = row.recipientId ? usersById.get(row.recipientId) : null

    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      senderUsername: sender?.username ?? 'unknown',
      senderAvatarUrl: sender?.avatarUrl ?? null,
      senderSubscriptionState: sender?.subscriptionState ?? 'free',
      recipientId: row.recipientId,
      recipientUsername: recipient?.username ?? 'unknown',
      recipientAvatarUrl: recipient?.avatarUrl ?? null,
      recipientSubscriptionState: recipient?.subscriptionState ?? 'free',
      content: expandMentionsToMarkdownLinks(row.content),
      createdDate: toIso(row.createdAt),
      sharedPost: row.sharedPostId
        ? (sharedPosts.get(row.sharedPostId) ?? null)
        : null,
      sharedImage: row.sharedImageId
        ? (sharedImages.get(row.sharedImageId) ?? null)
        : null,
    }
  })
}

async function getUsersByIdMap(
  userIds: number[]
): Promise<Map<number, UserMeta>> {
  const normalizedIds = uniqueIds(userIds)
  if (normalizedIds.length < 1) {
    return new Map()
  }

  const rows = await data
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      subscriptionState: users.subscriptionState,
    })
    .from(users)
    .where(inArray(users.id, normalizedIds))

  return new Map(
    rows.map(
      (row: {
        id: number
        username: string
        avatarUrl: string | null
        subscriptionState: string | null
      }) => [
        row.id,
        {
          id: row.id,
          username: row.username,
          avatarUrl: row.avatarUrl,
          subscriptionState: normalizeSubscription(row.subscriptionState),
        } satisfies UserMeta,
      ]
    )
  )
}

async function getSharedPostsById(
  postIds: number[]
): Promise<Map<number, BygMessageSharedPost>> {
  const normalizedPostIds = uniqueIds(postIds)
  if (normalizedPostIds.length < 1) {
    return new Map()
  }

  const rows = await data
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      author: users.username,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(inArray(posts.id, normalizedPostIds))

  return new Map(
    rows.map(
      (row: {
        id: number
        title: string
        content: string
        author: string | null
        createdAt: Date
      }) => [
        row.id,
        {
          id: row.id,
          title: row.title,
          content: expandMentionsToMarkdownLinks(row.content),
          author: row.author ?? 'unknown',
          createdDate: toIso(row.createdAt),
        } satisfies BygMessageSharedPost,
      ]
    )
  )
}

async function getSharedImagesById(
  imageIds: number[]
): Promise<Map<number, BygMessageSharedImage>> {
  const normalizedImageIds = uniqueIds(imageIds)
  if (normalizedImageIds.length < 1) {
    return new Map()
  }

  const rows = await data
    .select({
      id: images.id,
      title: images.title,
      imageUrl: images.imageUrl,
      author: users.username,
      createdAt: images.createdAt,
    })
    .from(images)
    .leftJoin(users, eq(images.authorId, users.id))
    .where(inArray(images.id, normalizedImageIds))

  return new Map(
    rows.map(
      (row: {
        id: number
        title: string
        imageUrl: string
        author: string | null
        createdAt: Date
      }) => [
        row.id,
        {
          id: row.id,
          title: row.title,
          imageUrl: row.imageUrl,
          author: row.author ?? 'unknown',
          createdDate: toIso(row.createdAt),
        } satisfies BygMessageSharedImage,
      ]
    )
  )
}

async function hydrateMessages(rows: MessageRow[]): Promise<BygMessage[]> {
  if (rows.length < 1) {
    return []
  }

  const userIds = rows.flatMap(row =>
    row.recipientId ? [row.senderId, row.recipientId] : [row.senderId]
  )

  const [usersById, sharedPosts, sharedImages] = await Promise.all([
    getUsersByIdMap(userIds),
    getSharedPostsById(
      rows
        .map(row => row.sharedPostId)
        .filter((id): id is number => id !== null)
    ),
    getSharedImagesById(
      rows
        .map(row => row.sharedImageId)
        .filter((id): id is number => id !== null)
    ),
  ])

  return mapMessageRows(rows, usersById, sharedPosts, sharedImages)
}

async function getConversationRowsForUser(
  userId: number
): Promise<ConversationRow[]> {
  return await data
    .select({
      id: messageConversations.id,
      type: messageConversations.type,
      name: messageConversations.name,
      title: messageConversations.title,
      imageUrl: messageConversations.imageUrl,
      description: messageConversations.description,
      creatorId: messageConversations.creatorId,
      createdAt: messageConversations.createdAt,
    })
    .from(messageConversations)
    .innerJoin(
      messageConversationMembers,
      eq(messageConversationMembers.conversationId, messageConversations.id)
    )
    .where(eq(messageConversationMembers.userId, userId))
    .orderBy(sql`${messageConversations.id} desc`)
}

async function getConversationForUser(
  conversationId: number,
  userId: number
): Promise<ConversationRow | null> {
  const rows = await data
    .select({
      id: messageConversations.id,
      type: messageConversations.type,
      name: messageConversations.name,
      title: messageConversations.title,
      imageUrl: messageConversations.imageUrl,
      description: messageConversations.description,
      creatorId: messageConversations.creatorId,
      createdAt: messageConversations.createdAt,
    })
    .from(messageConversations)
    .innerJoin(
      messageConversationMembers,
      eq(messageConversationMembers.conversationId, messageConversations.id)
    )
    .where(
      and(
        eq(messageConversations.id, conversationId),
        eq(messageConversationMembers.userId, userId)
      )
    )
    .limit(1)

  return rows[0] ?? null
}

async function getMembersByConversationIds(
  conversationIds: number[]
): Promise<Map<number, BygMessageConversationMember[]>> {
  const normalizedIds = uniqueIds(conversationIds)
  if (normalizedIds.length < 1) {
    return new Map()
  }

  const rows = await data
    .select({
      conversationId: messageConversationMembers.conversationId,
      userId: messageConversationMembers.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      subscriptionState: users.subscriptionState,
      creatorId: messageConversations.creatorId,
      createdAt: messageConversationMembers.createdAt,
    })
    .from(messageConversationMembers)
    .innerJoin(users, eq(messageConversationMembers.userId, users.id))
    .innerJoin(
      messageConversations,
      eq(messageConversationMembers.conversationId, messageConversations.id)
    )
    .where(inArray(messageConversationMembers.conversationId, normalizedIds))
    .orderBy(sql`${messageConversationMembers.id} asc`)

  const membersByConversation = new Map<
    number,
    BygMessageConversationMember[]
  >()

  for (const row of rows) {
    const members = membersByConversation.get(row.conversationId) ?? []
    members.push({
      userId: row.userId,
      username: row.username,
      avatarUrl: row.avatarUrl,
      subscriptionState: normalizeSubscription(row.subscriptionState),
      isCreator: row.userId === row.creatorId,
      joinedDate: toIso(row.createdAt),
    })
    membersByConversation.set(row.conversationId, members)
  }

  return membersByConversation
}

async function getMemberIds(conversationId: number): Promise<number[]> {
  const rows = await data
    .select({
      userId: messageConversationMembers.userId,
    })
    .from(messageConversationMembers)
    .where(eq(messageConversationMembers.conversationId, conversationId))

  return rows.map((row: { userId: number }) => row.userId)
}

async function getDirectConversationId(
  userId: number,
  recipientId: number
): Promise<number | null> {
  const userConversationRows = await data
    .select({
      conversationId: messageConversationMembers.conversationId,
    })
    .from(messageConversationMembers)
    .innerJoin(
      messageConversations,
      eq(messageConversationMembers.conversationId, messageConversations.id)
    )
    .where(
      and(
        eq(messageConversationMembers.userId, userId),
        eq(messageConversations.type, 'direct')
      )
    )

  const conversationIds = userConversationRows.map(
    (row: { conversationId: number }) => row.conversationId
  )
  if (conversationIds.length < 1) return null

  const memberRows = await data
    .select({
      conversationId: messageConversationMembers.conversationId,
      userId: messageConversationMembers.userId,
    })
    .from(messageConversationMembers)
    .where(inArray(messageConversationMembers.conversationId, conversationIds))

  const membersByConversation = new Map<number, Set<number>>()
  for (const row of memberRows) {
    const members = membersByConversation.get(row.conversationId) ?? new Set()
    members.add(row.userId)
    membersByConversation.set(row.conversationId, members)
  }

  for (const [conversationId, members] of membersByConversation) {
    if (members.size === 2 && members.has(userId) && members.has(recipientId)) {
      return conversationId
    }
  }

  return null
}

async function createConversationMembers(
  conversationId: number,
  userIds: number[],
  invitedById: number | null
): Promise<void> {
  const values = uniqueIds(userIds).map(userId => ({
    conversationId,
    userId,
    invitedById,
    createdAt: new Date(),
  }))

  if (values.length < 1) return

  await data
    .insert(messageConversationMembers)
    .values(values)
    .onConflictDoNothing()
}

async function buildConversation(
  conversation: ConversationRow,
  messagesLimit: number
): Promise<BygMessageConversation> {
  const boundedLimit = clampLimit(messagesLimit, 1, 250, 120)

  const rows: MessageRow[] = await data
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      content: messages.content,
      sharedPostId: messages.sharedPostId,
      sharedImageId: messages.sharedImageId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(sql`${messages.id} asc`)
    .limit(boundedLimit)

  const [hydratedMessages, membersByConversation] = await Promise.all([
    hydrateMessages(rows),
    getMembersByConversationIds([conversation.id]),
  ])

  return {
    conversationId: conversation.id,
    type: conversation.type,
    name: conversation.name,
    title: conversation.title,
    imageUrl: conversation.imageUrl,
    description: conversation.description,
    creatorId: conversation.creatorId,
    members: membersByConversation.get(conversation.id) ?? [],
    messages: hydratedMessages,
  }
}

async function validateSharePayload(input: {
  sharedPostId?: number
  sharedImageId?: number
}): Promise<SendMessageErrorCode | null> {
  if (input.sharedPostId && input.sharedImageId) {
    return 'invalid_share_payload'
  }

  if (input.sharedPostId) {
    const sharedPost = await data
      .select({
        id: posts.id,
      })
      .from(posts)
      .where(eq(posts.id, input.sharedPostId))
      .limit(1)
    if (!sharedPost[0]?.id) {
      return 'post_not_found'
    }
  }

  if (input.sharedImageId) {
    const sharedImage = await data
      .select({
        id: images.id,
      })
      .from(images)
      .where(eq(images.id, input.sharedImageId))
      .limit(1)
    if (!sharedImage[0]?.id) {
      return 'image_not_found'
    }
  }

  return null
}

export abstract class MessagesQueries {
  static async getMessageThreads(
    userId: number,
    limit: number
  ): Promise<BygMessageThread[]> {
    const boundedLimit = clampLimit(limit, 1, 60, 24)
    const conversations = await getConversationRowsForUser(userId)
    const conversationIds = conversations.map(conversation => conversation.id)
    if (conversationIds.length < 1) return []

    const [latestRows, membersByConversation] = await Promise.all([
      data
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          recipientId: messages.recipientId,
          content: messages.content,
          sharedPostId: messages.sharedPostId,
          sharedImageId: messages.sharedImageId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(inArray(messages.conversationId, conversationIds))
        .orderBy(sql`${messages.id} desc`)
        .limit(Math.max(boundedLimit * 10, 120)) as Promise<MessageRow[]>,
      getMembersByConversationIds(conversationIds),
    ])

    const latestByConversation = new Map<number, MessageRow>()
    for (const row of latestRows) {
      if (!latestByConversation.has(row.conversationId)) {
        latestByConversation.set(row.conversationId, row)
      }
    }

    return conversations
      .map(conversation => {
        const lastMessage = latestByConversation.get(conversation.id)
        return {
          conversationId: conversation.id,
          type: conversation.type,
          name: conversation.name,
          title: conversation.title,
          imageUrl: conversation.imageUrl,
          description: conversation.description,
          creatorId: conversation.creatorId,
          members: membersByConversation.get(conversation.id) ?? [],
          lastMessagePreview: lastMessage
            ? previewMessage(
                lastMessage.content,
                lastMessage.sharedPostId !== null,
                lastMessage.sharedImageId !== null
              )
            : 'No messages yet',
          lastMessageDate: toIso(
            lastMessage?.createdAt ?? conversation.createdAt
          ),
        } satisfies BygMessageThread
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessageDate).getTime() -
          new Date(a.lastMessageDate).getTime()
      )
      .slice(0, boundedLimit)
  }

  static async getConversationById(
    userId: number,
    conversationId: number,
    limit: number
  ): Promise<BygMessageConversation | null> {
    const conversation = await getConversationForUser(conversationId, userId)
    if (!conversation) return null

    return await buildConversation(conversation, limit)
  }

  static async getConversationByUsername(
    userId: number,
    username: string,
    limit: number
  ): Promise<BygMessageConversation | null> {
    const normalizedUsername = username.trim()
    if (!normalizedUsername) {
      return null
    }

    const counterpart = await data.query.users.findFirst({
      where: sql`lower(${users.username}) = lower(${normalizedUsername})`,
    })
    if (!counterpart || counterpart.id === userId) {
      return null
    }

    const conversationId = await getDirectConversationId(userId, counterpart.id)
    if (!conversationId) {
      return {
        conversationId: 0,
        type: 'direct',
        name: null,
        title: null,
        imageUrl: null,
        description: null,
        creatorId: userId,
        members: [
          {
            userId: counterpart.id,
            username: counterpart.username,
            avatarUrl: counterpart.avatarUrl,
            subscriptionState: normalizeSubscription(
              counterpart.subscriptionState
            ),
            isCreator: false,
            joinedDate: new Date().toISOString(),
          },
        ],
        messages: [],
      }
    }

    return await this.getConversationById(userId, conversationId, limit)
  }

  static async getShareTargets(
    userId: number,
    limit: number
  ): Promise<BygMessageShareTarget[]> {
    const boundedLimit = clampLimit(limit, 1, 60, 24)

    const [conversationRows, followingRows] = await Promise.all([
      data
        .select({
          conversationId: messageConversationMembers.conversationId,
        })
        .from(messageConversationMembers)
        .where(eq(messageConversationMembers.userId, userId))
        .orderBy(sql`${messageConversationMembers.id} desc`)
        .limit(Math.max(boundedLimit * 16, 160)),

      data
        .select({
          followingId: followings.followingId,
        })
        .from(followings)
        .where(eq(followings.followerId, userId))
        .orderBy(sql`${followings.id} desc`)
        .limit(Math.max(boundedLimit * 4, 80)),
    ])

    const conversationIds = conversationRows.map(
      (row: { conversationId: number }) => row.conversationId
    )
    const membersByConversation =
      await getMembersByConversationIds(conversationIds)
    const recentIds = uniqueIds(
      conversationIds.flatMap((id: number) =>
        (membersByConversation.get(id) ?? [])
          .map(member => member.userId)
          .filter(memberId => memberId !== userId)
      )
    )
    const followingIds = uniqueIds(
      followingRows.map((row: { followingId: number }) => row.followingId)
    )

    const usersById = await getUsersByIdMap([...recentIds, ...followingIds])
    const targets: BygMessageShareTarget[] = []
    const used = new Set<number>()

    for (const id of recentIds) {
      const user = usersById.get(id)
      if (!user || used.has(id)) continue

      targets.push({
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        subscriptionState: user.subscriptionState,
        source: 'recent',
      })
      used.add(id)

      if (targets.length >= boundedLimit) {
        return targets
      }
    }

    for (const id of followingIds) {
      const user = usersById.get(id)
      if (!user || used.has(id)) continue

      targets.push({
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        subscriptionState: user.subscriptionState,
        source: 'following',
      })
      used.add(id)

      if (targets.length >= boundedLimit) {
        break
      }
    }

    return targets
  }

  static async getOrCreateDirectConversation(
    userId: number,
    recipientId: number
  ): Promise<ConversationMutationResult> {
    if (userId === recipientId) {
      return { ok: false, code: 'cannot_message_self' }
    }

    const recipient = await data
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1)
    if (!recipient[0]?.id) {
      return { ok: false, code: 'recipient_not_found' }
    }

    const existingConversationId = await getDirectConversationId(
      userId,
      recipientId
    )
    if (existingConversationId) {
      const existing = await this.getConversationById(
        userId,
        existingConversationId,
        120
      )
      if (!existing) return { ok: false, code: 'save_failed' }
      return { ok: true, conversation: existing }
    }

    const insertedRows = await data
      .insert(messageConversations)
      .values({
        type: 'direct',
        creatorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: messageConversations.id,
      })
    const conversationId = insertedRows[0]?.id
    if (!conversationId) {
      return { ok: false, code: 'save_failed' }
    }

    await createConversationMembers(
      conversationId,
      [userId, recipientId],
      userId
    )

    const conversation = await this.getConversationById(
      userId,
      conversationId,
      120
    )
    if (!conversation) {
      return { ok: false, code: 'save_failed' }
    }

    return { ok: true, conversation }
  }

  static async createGroupConversation(input: {
    creatorId: number
    memberIds: number[]
    name?: string | null
    title?: string | null
    imageUrl?: string | null
    description?: string | null
  }): Promise<ConversationMutationResult> {
    const memberIds = uniqueIds(
      input.memberIds
        .map(id => Math.trunc(id))
        .filter(id => Number.isFinite(id) && id !== input.creatorId)
    )
    if (memberIds.length < 1) {
      return { ok: false, code: 'empty_group' }
    }

    const existingUsers = await data
      .select({
        id: users.id,
      })
      .from(users)
      .where(inArray(users.id, memberIds))
    if (existingUsers.length !== memberIds.length) {
      return { ok: false, code: 'recipient_not_found' }
    }

    const insertedRows = await data
      .insert(messageConversations)
      .values({
        type: 'group',
        name: normalizeNullableText(input.name),
        title: normalizeNullableText(input.title),
        imageUrl: normalizeNullableText(input.imageUrl),
        description: normalizeNullableText(input.description),
        creatorId: input.creatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: messageConversations.id,
      })
    const conversationId = insertedRows[0]?.id
    if (!conversationId) {
      return { ok: false, code: 'save_failed' }
    }

    await createConversationMembers(
      conversationId,
      [input.creatorId, ...memberIds],
      input.creatorId
    )

    const conversation = await this.getConversationById(
      input.creatorId,
      conversationId,
      120
    )
    if (!conversation) {
      return { ok: false, code: 'save_failed' }
    }

    return { ok: true, conversation }
  }

  static async inviteGroupMember(input: {
    conversationId: number
    actorId: number
    userId: number
  }): Promise<ConversationMutationResult> {
    const conversation = await getConversationForUser(
      input.conversationId,
      input.actorId
    )
    if (!conversation) {
      return { ok: false, code: 'conversation_not_found' }
    }
    if (conversation.type !== 'group') {
      return { ok: false, code: 'not_group_conversation' }
    }
    if (conversation.creatorId !== input.actorId) {
      return { ok: false, code: 'not_conversation_creator' }
    }

    const recipient = await data
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1)
    if (!recipient[0]?.id) {
      return { ok: false, code: 'recipient_not_found' }
    }

    await createConversationMembers(
      input.conversationId,
      [input.userId],
      input.actorId
    )

    const updatedConversation = await this.getConversationById(
      input.actorId,
      input.conversationId,
      120
    )
    if (!updatedConversation) {
      return { ok: false, code: 'save_failed' }
    }

    return { ok: true, conversation: updatedConversation }
  }

  static async updateGroupInfo(input: {
    conversationId: number
    actorId: number
    name?: string | null
    title?: string | null
    imageUrl?: string | null
    description?: string | null
  }): Promise<ConversationMutationResult> {
    const conversation = await getConversationForUser(
      input.conversationId,
      input.actorId
    )
    if (!conversation) {
      return { ok: false, code: 'conversation_not_found' }
    }
    if (conversation.type !== 'group') {
      return { ok: false, code: 'not_group_conversation' }
    }
    if (conversation.creatorId !== input.actorId) {
      return { ok: false, code: 'not_conversation_creator' }
    }

    await data
      .update(messageConversations)
      .set({
        name:
          input.name === undefined
            ? conversation.name
            : normalizeNullableText(input.name),
        title:
          input.title === undefined
            ? conversation.title
            : normalizeNullableText(input.title),
        imageUrl:
          input.imageUrl === undefined
            ? conversation.imageUrl
            : normalizeNullableText(input.imageUrl),
        description:
          input.description === undefined
            ? conversation.description
            : normalizeNullableText(input.description),
        updatedAt: new Date(),
      })
      .where(eq(messageConversations.id, input.conversationId))

    const updatedConversation = await this.getConversationById(
      input.actorId,
      input.conversationId,
      120
    )
    if (!updatedConversation) {
      return { ok: false, code: 'save_failed' }
    }

    return { ok: true, conversation: updatedConversation }
  }

  static async removeGroupMember(input: {
    conversationId: number
    actorId: number
    userId: number
  }): Promise<ConversationMutationResult> {
    const conversation = await getConversationForUser(
      input.conversationId,
      input.actorId
    )
    if (!conversation) {
      return { ok: false, code: 'conversation_not_found' }
    }
    if (conversation.type !== 'group') {
      return { ok: false, code: 'not_group_conversation' }
    }
    if (conversation.creatorId !== input.actorId) {
      return { ok: false, code: 'not_conversation_creator' }
    }
    if (input.userId === conversation.creatorId) {
      return { ok: false, code: 'not_conversation_creator' }
    }

    await data
      .delete(messageConversationMembers)
      .where(
        and(
          eq(messageConversationMembers.conversationId, input.conversationId),
          eq(messageConversationMembers.userId, input.userId)
        )
      )

    const updatedConversation = await this.getConversationById(
      input.actorId,
      input.conversationId,
      120
    )
    if (!updatedConversation) {
      return { ok: false, code: 'save_failed' }
    }

    return { ok: true, conversation: updatedConversation }
  }

  static async sendMessage(
    input: SendMessageInput
  ): Promise<SendMessageResult> {
    if (!input.conversationId && !input.recipientId) {
      return { ok: false, code: 'invalid_conversation_target' }
    }
    if (input.conversationId && input.recipientId) {
      return { ok: false, code: 'invalid_conversation_target' }
    }
    if (input.recipientId && input.senderId === input.recipientId) {
      return { ok: false, code: 'cannot_message_self' }
    }

    const normalizedContent = input.content?.trim() ?? ''
    if (!normalizedContent && !input.sharedPostId && !input.sharedImageId) {
      return { ok: false, code: 'empty_message' }
    }

    const shareError = await validateSharePayload(input)
    if (shareError) {
      return { ok: false, code: shareError }
    }

    let conversationId = input.conversationId ?? null
    let legacyRecipientId: number | null = null

    if (input.recipientId) {
      const directResult = await this.getOrCreateDirectConversation(
        input.senderId,
        input.recipientId
      )
      if (!directResult.ok) {
        switch (directResult.code) {
          case 'cannot_message_self':
          case 'recipient_not_found':
          case 'save_failed':
            return { ok: false, code: directResult.code }
          default:
            return { ok: false, code: 'save_failed' }
        }
      }
      conversationId = directResult.conversation.conversationId
      legacyRecipientId = input.recipientId
    }

    if (!conversationId) {
      return { ok: false, code: 'invalid_conversation_target' }
    }

    const conversation = await getConversationForUser(
      conversationId,
      input.senderId
    )
    if (!conversation) {
      return { ok: false, code: 'not_conversation_member' }
    }

    if (conversation.type === 'direct') {
      const memberIds = await getMemberIds(conversation.id)
      legacyRecipientId =
        memberIds.find(memberId => memberId !== input.senderId) ?? null
    }

    const insertedRows = await data
      .insert(messages)
      .values({
        conversationId,
        senderId: input.senderId,
        recipientId: legacyRecipientId,
        content: normalizedContent,
        sharedPostId: input.sharedPostId ?? null,
        sharedImageId: input.sharedImageId ?? null,
        createdAt: new Date(),
      })
      .returning({
        id: messages.id,
      })
    const messageId = insertedRows[0]?.id
    if (!messageId) {
      return { ok: false, code: 'save_failed' }
    }

    if (input.sharedPostId) {
      await ShareQueries.augmentPostShares(input.sharedPostId)
    }
    if (input.sharedImageId) {
      await ShareQueries.augmentImageShares(input.sharedImageId)
    }

    const storedRows: MessageRow[] = await data
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        sharedPostId: messages.sharedPostId,
        sharedImageId: messages.sharedImageId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    if (storedRows.length < 1) {
      return { ok: false, code: 'save_failed' }
    }

    const [hydratedMessage] = await hydrateMessages(storedRows)
    if (!hydratedMessage) {
      return { ok: false, code: 'save_failed' }
    }

    return {
      ok: true,
      message: hydratedMessage,
      memberIds: await getMemberIds(conversation.id),
    }
  }
}
