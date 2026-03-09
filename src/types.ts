import { InferSelectModel } from 'drizzle-orm'
import {
  images,
  posts,
  postComments,
  imageComments,
  messages,
  users,
} from '@/data/tables'

// ---- Raw DB models (internal) ----
export type BygUserRaw = InferSelectModel<typeof users>
export type BygPostRaw = InferSelectModel<typeof posts>
export type BygImageRaw = InferSelectModel<typeof images>
export type BygPostCommentRaw = InferSelectModel<typeof postComments>
export type BygImageCommentRaw = InferSelectModel<typeof imageComments>
export type BygMessageRaw = InferSelectModel<typeof messages>

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
  | 'message'

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

export interface BygMessageSharedPost {
  id: number
  title: string
  content: string
  author: string
  createdDate: string
}

export interface BygMessageSharedImage {
  id: number
  title: string
  imageUrl: string
  author: string
  createdDate: string
}

export interface BygMessage {
  id: number
  senderId: number
  senderUsername: string
  senderAvatarUrl: string | null
  senderSubscriptionState: string
  recipientId: number
  recipientUsername: string
  recipientAvatarUrl: string | null
  recipientSubscriptionState: string
  content: string
  createdDate: string
  sharedPost: BygMessageSharedPost | null
  sharedImage: BygMessageSharedImage | null
}

export interface BygMessageThread {
  userId: number
  username: string
  avatarUrl: string | null
  subscriptionState: string
  lastMessagePreview: string
  lastMessageDate: string
}

export interface BygMessageConversation {
  userId: number
  username: string
  avatarUrl: string | null
  subscriptionState: string
  messages: BygMessage[]
}

export interface BygMessageShareTarget {
  userId: number
  username: string
  avatarUrl: string | null
  subscriptionState: string
  source: 'recent' | 'following'
}

export interface BygLiveMessageEvent {
  type: 'message:new'
  message: BygMessage
}

export interface BygLiveTypingEvent {
  type: 'typing'
  fromUserId: number
  fromUsername: string
  isTyping: boolean
}
