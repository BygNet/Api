import { and, eq, inArray, or, sql } from 'drizzle-orm'

import { data } from '@/data/client'
import { followings, images, messages, posts, users } from '@/data/tables'
import { ShareQueries } from '@/share/queries'
import type {
  BygMessage,
  BygMessageConversation,
  BygMessageShareTarget,
  BygMessageSharedImage,
  BygMessageSharedPost,
  BygMessageThread,
} from '@/types'
import { expandMentionsToMarkdownLinks } from '@/utils/mentions'

type MessageRow = {
  id: number
  senderId: number
  recipientId: number
  content: string
  sharedPostId: number | null
  sharedImageId: number | null
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
  | 'recipient_not_found'
  | 'post_not_found'
  | 'image_not_found'
  | 'save_failed'

export type SendMessageResult =
  | {
      ok: true
      message: BygMessage
    }
  | {
      ok: false
      code: SendMessageErrorCode
    }

interface SendMessageInput {
  senderId: number
  recipientId: number
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

function previewMessage(
  content: string,
  hasSharedPost: boolean,
  hasSharedImage: boolean
): string {
  const trimmed = content.trim()
  if (trimmed) {
    return trimmed.length <= 80 ? trimmed : `${trimmed.slice(0, 80)}…`
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
    const recipient = usersById.get(row.recipientId)

    return {
      id: row.id,
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

  const [usersById, sharedPosts, sharedImages] = await Promise.all([
    getUsersByIdMap(rows.flatMap(row => [row.senderId, row.recipientId])),
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

export abstract class MessagesQueries {
  static async getMessageThreads(
    userId: number,
    limit: number
  ): Promise<BygMessageThread[]> {
    const boundedLimit = clampLimit(limit, 1, 60, 24)
    const candidateLimit = Math.max(boundedLimit * 14, 140)

    const rows: MessageRow[] = await data
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        sharedPostId: messages.sharedPostId,
        sharedImageId: messages.sharedImageId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        or(eq(messages.senderId, userId), eq(messages.recipientId, userId))
      )
      .orderBy(sql`${messages.id} desc`)
      .limit(candidateLimit)

    if (rows.length < 1) {
      return []
    }

    const counterpartIds = uniqueIds(
      rows.map(row =>
        row.senderId === userId ? row.recipientId : row.senderId
      )
    )
    const usersById = await getUsersByIdMap(counterpartIds)

    const threads: BygMessageThread[] = []
    const used = new Set<number>()

    for (const row of rows) {
      const counterpartId =
        row.senderId === userId ? row.recipientId : row.senderId
      if (used.has(counterpartId)) continue

      const counterpart = usersById.get(counterpartId)
      if (!counterpart) continue

      threads.push({
        userId: counterpartId,
        username: counterpart.username,
        avatarUrl: counterpart.avatarUrl,
        subscriptionState: counterpart.subscriptionState,
        lastMessagePreview: previewMessage(
          row.content,
          row.sharedPostId !== null,
          row.sharedImageId !== null
        ),
        lastMessageDate: toIso(row.createdAt),
      })

      used.add(counterpartId)
      if (threads.length >= boundedLimit) {
        break
      }
    }

    return threads
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
    if (!counterpart) {
      return null
    }

    const boundedLimit = clampLimit(limit, 1, 250, 120)

    const rows: MessageRow[] = await data
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        sharedPostId: messages.sharedPostId,
        sharedImageId: messages.sharedImageId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.recipientId, counterpart.id)
          ),
          and(
            eq(messages.senderId, counterpart.id),
            eq(messages.recipientId, userId)
          )
        )
      )
      .orderBy(sql`${messages.id} asc`)
      .limit(boundedLimit)

    const hydratedMessages = await hydrateMessages(rows)

    return {
      userId: counterpart.id,
      username: counterpart.username,
      avatarUrl: counterpart.avatarUrl,
      subscriptionState: normalizeSubscription(counterpart.subscriptionState),
      messages: hydratedMessages,
    }
  }

  static async getShareTargets(
    userId: number,
    limit: number
  ): Promise<BygMessageShareTarget[]> {
    const boundedLimit = clampLimit(limit, 1, 60, 24)

    const [recentMessageRows, followingRows] = await Promise.all([
      data
        .select({
          senderId: messages.senderId,
          recipientId: messages.recipientId,
        })
        .from(messages)
        .where(
          or(eq(messages.senderId, userId), eq(messages.recipientId, userId))
        )
        .orderBy(sql`${messages.id} desc`)
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

    const recentIds = uniqueIds(
      recentMessageRows
        .map((row: { senderId: number; recipientId: number }) =>
          row.senderId === userId ? row.recipientId : row.senderId
        )
        .filter((id: number) => id !== userId)
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

  static async sendMessage(
    input: SendMessageInput
  ): Promise<SendMessageResult> {
    if (input.senderId === input.recipientId) {
      return { ok: false, code: 'cannot_message_self' }
    }

    if (input.sharedPostId && input.sharedImageId) {
      return { ok: false, code: 'invalid_share_payload' }
    }

    const normalizedContent = input.content?.trim() ?? ''
    if (!normalizedContent && !input.sharedPostId && !input.sharedImageId) {
      return { ok: false, code: 'empty_message' }
    }

    const recipient = await data
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.id, input.recipientId))
      .limit(1)
    if (!recipient[0]?.id) {
      return { ok: false, code: 'recipient_not_found' }
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
        return { ok: false, code: 'post_not_found' }
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
        return { ok: false, code: 'image_not_found' }
      }
    }

    const insertedRows = await data
      .insert(messages)
      .values({
        senderId: input.senderId,
        recipientId: input.recipientId,
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
    }
  }
}
