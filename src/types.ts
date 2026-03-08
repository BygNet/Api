import { InferSelectModel } from 'drizzle-orm'
import {
  images,
  posts,
  postComments,
  imageComments,
  users,
} from '@/data/tables'

// ---- Raw DB models (internal) ----
export type BygUserRaw = InferSelectModel<typeof users>
export type BygPostRaw = InferSelectModel<typeof posts>
export type BygImageRaw = InferSelectModel<typeof images>
export type BygPostCommentRaw = InferSelectModel<typeof postComments>
export type BygImageCommentRaw = InferSelectModel<typeof imageComments>

// ---- API / frontend-facing models ----
export type BygPost = Omit<BygPostRaw, 'authorId' | 'createdAt'> & {
  author: string
  createdDate: string
}

export type BygImage = Omit<BygImageRaw, 'authorId' | 'createdAt'> & {
  author: string
  createdDate: string
}

export interface BygUserSuggestion {
  id: number
  username: string
  avatarUrl: string | null
  subscriptionState: string
}

export type BygNotificationType =
  | 'follow'
  | 'post_comment'
  | 'image_comment'
  | 'post_mention'
  | 'comment_mention'

export interface BygNotification {
  id: string
  type: BygNotificationType
  actorUsername: string
  actorAvatarUrl: string | null
  actorSubscriptionState: string
  text: string
  path: string
  createdDate: string
}
