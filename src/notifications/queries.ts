import { and, eq, ne, sql } from 'drizzle-orm'

import { data } from '@/data/client'
import {
  followings,
  imageComments,
  images,
  postComments,
  posts,
  users,
} from '@/data/tables'
import { BygNotification } from '@/types'
import { extractMentionUsernames } from '@/utils/mentions'

type FollowNotificationRow = {
  id: number
  actorUsername: string | null
  actorAvatarUrl: string | null
  actorSubscriptionState: string | null
  createdAt: Date
}

type PostCommentNotificationRow = {
  id: number
  postId: number
  content: string
  actorUsername: string | null
  actorAvatarUrl: string | null
  actorSubscriptionState: string | null
  createdAt: Date
}

type ImageCommentNotificationRow = {
  id: number
  imageId: number
  content: string
  actorUsername: string | null
  actorAvatarUrl: string | null
  actorSubscriptionState: string | null
  createdAt: Date
}

type PostMentionNotificationRow = {
  postId: number
  content: string
  actorUsername: string | null
  actorAvatarUrl: string | null
  actorSubscriptionState: string | null
  createdAt: Date
}

type PostCommentMentionNotificationRow = {
  commentId: number
  postId: number
  content: string
  actorUsername: string | null
  actorAvatarUrl: string | null
  actorSubscriptionState: string | null
  createdAt: Date
}

type ImageCommentMentionNotificationRow = {
  commentId: number
  imageId: number
  content: string
  actorUsername: string | null
  actorAvatarUrl: string | null
  actorSubscriptionState: string | null
  createdAt: Date
}

function normalizeSubscription(state: string | null): string {
  return state ?? 'free'
}

function summarizeComment(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 80)}…`
}

export abstract class NotificationsQueries {
  static async getRecentNotifications(
    userId: number,
    limit: number
  ): Promise<BygNotification[]> {
    const boundedLimit = Math.max(1, Math.min(limit, 100))
    const mentionCandidateLimit = Math.max(
      boundedLimit * 12,
      120
    )

    const currentUser = await data
      .select({
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const normalizedCurrentUsername =
      currentUser[0]?.username?.toLowerCase()
    if (!normalizedCurrentUsername) {
      return []
    }

    const [
      followRows,
      postCommentRows,
      imageCommentRows,
      postMentionRows,
      postCommentMentionRows,
      imageCommentMentionRows,
    ] = await Promise.all([
      data
        .select({
          id: followings.id,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
          actorSubscriptionState: users.subscriptionState,
          createdAt: followings.createdAt,
        })
        .from(followings)
        .leftJoin(users, eq(followings.followerId, users.id))
        .where(eq(followings.followingId, userId))
        .orderBy(sql`${followings.id} desc`)
        .limit(boundedLimit) as Promise<FollowNotificationRow[]>,

      data
        .select({
          id: postComments.id,
          postId: postComments.postId,
          content: postComments.content,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
          actorSubscriptionState: users.subscriptionState,
          createdAt: postComments.createdAt,
        })
        .from(postComments)
        .leftJoin(posts, eq(postComments.postId, posts.id))
        .leftJoin(users, eq(postComments.authorId, users.id))
        .where(
          and(
            eq(posts.authorId, userId),
            ne(postComments.authorId, userId)
          )
        )
        .orderBy(sql`${postComments.id} desc`)
        .limit(boundedLimit) as Promise<PostCommentNotificationRow[]>,

      data
        .select({
          id: imageComments.id,
          imageId: imageComments.imageId,
          content: imageComments.content,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
          actorSubscriptionState: users.subscriptionState,
          createdAt: imageComments.createdAt,
        })
        .from(imageComments)
        .leftJoin(images, eq(imageComments.imageId, images.id))
        .leftJoin(users, eq(imageComments.authorId, users.id))
        .where(
          and(
            eq(images.authorId, userId),
            ne(imageComments.authorId, userId)
          )
        )
        .orderBy(sql`${imageComments.id} desc`)
        .limit(boundedLimit) as Promise<ImageCommentNotificationRow[]>,

      data
        .select({
          postId: posts.id,
          content: posts.content,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
          actorSubscriptionState: users.subscriptionState,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(ne(posts.authorId, userId))
        .orderBy(sql`${posts.id} desc`)
        .limit(
          mentionCandidateLimit
        ) as Promise<PostMentionNotificationRow[]>,

      data
        .select({
          commentId: postComments.id,
          postId: postComments.postId,
          content: postComments.content,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
          actorSubscriptionState: users.subscriptionState,
          createdAt: postComments.createdAt,
        })
        .from(postComments)
        .leftJoin(users, eq(postComments.authorId, users.id))
        .where(ne(postComments.authorId, userId))
        .orderBy(sql`${postComments.id} desc`)
        .limit(
          mentionCandidateLimit
        ) as Promise<PostCommentMentionNotificationRow[]>,

      data
        .select({
          commentId: imageComments.id,
          imageId: imageComments.imageId,
          content: imageComments.content,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
          actorSubscriptionState: users.subscriptionState,
          createdAt: imageComments.createdAt,
        })
        .from(imageComments)
        .leftJoin(users, eq(imageComments.authorId, users.id))
        .where(ne(imageComments.authorId, userId))
        .orderBy(sql`${imageComments.id} desc`)
        .limit(
          mentionCandidateLimit
        ) as Promise<ImageCommentMentionNotificationRow[]>,
    ])

    const notifications: BygNotification[] = [
      ...followRows.map(row => {
        const actorUsername = row.actorUsername ?? 'unknown'
        const path =
          actorUsername === 'unknown' ? '/me' : `/u/${actorUsername}`

        return {
          id: `follow-${row.id}`,
          type: 'follow' as const,
          actorUsername,
          actorAvatarUrl: row.actorAvatarUrl,
          actorSubscriptionState: normalizeSubscription(
            row.actorSubscriptionState
          ),
          text: `${actorUsername} followed you`,
          path,
          createdDate: row.createdAt.toISOString(),
        }
      }),

      ...postCommentRows.map(row => {
        const actorUsername = row.actorUsername ?? 'unknown'

        return {
          id: `post-comment-${row.id}`,
          type: 'post_comment' as const,
          actorUsername,
          actorAvatarUrl: row.actorAvatarUrl,
          actorSubscriptionState: normalizeSubscription(
            row.actorSubscriptionState
          ),
          text: `${actorUsername} commented: ${summarizeComment(
            row.content
          )}`,
          path: `/details/${row.postId}`,
          createdDate: row.createdAt.toISOString(),
        }
      }),

      ...imageCommentRows.map(row => {
        const actorUsername = row.actorUsername ?? 'unknown'

        return {
          id: `image-comment-${row.id}`,
          type: 'image_comment' as const,
          actorUsername,
          actorAvatarUrl: row.actorAvatarUrl,
          actorSubscriptionState: normalizeSubscription(
            row.actorSubscriptionState
          ),
          text: `${actorUsername} commented: ${summarizeComment(
            row.content
          )}`,
          path: `/image/${row.imageId}`,
          createdDate: row.createdAt.toISOString(),
        }
      }),

      ...postMentionRows
        .filter(row =>
          extractMentionUsernames(row.content).includes(
            normalizedCurrentUsername
          )
        )
        .map(row => {
          const actorUsername = row.actorUsername ?? 'unknown'

          return {
            id: `post-mention-${row.postId}`,
            type: 'post_mention' as const,
            actorUsername,
            actorAvatarUrl: row.actorAvatarUrl,
            actorSubscriptionState: normalizeSubscription(
              row.actorSubscriptionState
            ),
            text: `${actorUsername} mentioned you in a post`,
            path: `/details/${row.postId}`,
            createdDate: row.createdAt.toISOString(),
          }
        }),

      ...postCommentMentionRows
        .filter(row =>
          extractMentionUsernames(row.content).includes(
            normalizedCurrentUsername
          )
        )
        .map(row => {
          const actorUsername = row.actorUsername ?? 'unknown'

          return {
            id: `post-comment-mention-${row.commentId}`,
            type: 'comment_mention' as const,
            actorUsername,
            actorAvatarUrl: row.actorAvatarUrl,
            actorSubscriptionState: normalizeSubscription(
              row.actorSubscriptionState
            ),
            text: `${actorUsername} mentioned you in a comment`,
            path: `/details/${row.postId}`,
            createdDate: row.createdAt.toISOString(),
          }
        }),

      ...imageCommentMentionRows
        .filter(row =>
          extractMentionUsernames(row.content).includes(
            normalizedCurrentUsername
          )
        )
        .map(row => {
          const actorUsername = row.actorUsername ?? 'unknown'

          return {
            id: `image-comment-mention-${row.commentId}`,
            type: 'comment_mention' as const,
            actorUsername,
            actorAvatarUrl: row.actorAvatarUrl,
            actorSubscriptionState: normalizeSubscription(
              row.actorSubscriptionState
            ),
            text: `${actorUsername} mentioned you in a comment`,
            path: `/image/${row.imageId}`,
            createdDate: row.createdAt.toISOString(),
          }
        }),
    ]

    return notifications
      .sort(
        (a, b) =>
          new Date(b.createdDate).getTime() -
          new Date(a.createdDate).getTime()
      )
      .slice(0, boundedLimit)
  }
}

