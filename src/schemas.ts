import { t } from 'elysia'

export const CreatePostSchema = t.Object({
  title: t.String(),
  content: t.String(),
})
export type CreatePostBody = typeof CreatePostSchema.static

export const UploadImageSchema = t.Object({
  title: t.String(),
  imageUrl: t.String(),
})
export type UploadImageBody = typeof UploadImageSchema.static

export const CommentSchema = t.Object({
  id: t.Number(),
  content: t.String(),
})
export type CommentBody = typeof CommentSchema.static

export const PushSubscriptionSchema = t.Object({
  endpoint: t.String(),
  expirationTime: t.Union([t.Number(), t.Null()]),
  keys: t.Object({
    p256dh: t.String(),
    auth: t.String(),
  }),
})
export type PushSubscriptionBody = typeof PushSubscriptionSchema.static

export const PushUnsubscribeSchema = t.Object({
  endpoint: t.String(),
})
export type PushUnsubscribeBody = typeof PushUnsubscribeSchema.static

export const MessageSendSchema = t.Object({
  conversationId: t.Optional(t.Number()),
  recipientId: t.Optional(t.Number()),
  content: t.Optional(t.String()),
  sharedPostId: t.Optional(t.Number()),
  sharedImageId: t.Optional(t.Number()),
})
export type MessageSendBody = typeof MessageSendSchema.static

export const MessageDirectConversationSchema = t.Object({
  recipientId: t.Number(),
})
export type MessageDirectConversationBody =
  typeof MessageDirectConversationSchema.static

export const MessageGroupConversationSchema = t.Object({
  name: t.Optional(t.String()),
  title: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
  description: t.Optional(t.String()),
  memberIds: t.Array(t.Number()),
})
export type MessageGroupConversationBody =
  typeof MessageGroupConversationSchema.static

export const MessageConversationInviteSchema = t.Object({
  userId: t.Number(),
})
export type MessageConversationInviteBody =
  typeof MessageConversationInviteSchema.static

export const MessageConversationInfoSchema = t.Object({
  name: t.Optional(t.Union([t.String(), t.Null()])),
  title: t.Optional(t.Union([t.String(), t.Null()])),
  imageUrl: t.Optional(t.Union([t.String(), t.Null()])),
  description: t.Optional(t.Union([t.String(), t.Null()])),
})
export type MessageConversationInfoBody =
  typeof MessageConversationInfoSchema.static

export const UpdateProfileSchema = t.Object({
  displayName: t.Optional(t.Union([t.String(), t.Null()])),
  pronouns: t.Optional(t.Union([t.String(), t.Null()])),
  songLinkUrl: t.Optional(t.Union([t.String(), t.Null()])),
  bio: t.Optional(t.Union([t.String(), t.Null()])),
  avatarUrl: t.Optional(t.Union([t.String(), t.Null()])),
  bannerUrl: t.Optional(t.Union([t.String(), t.Null()])),
  subscriptionState: t.Optional(t.Union([t.String(), t.Null()])),
  color: t.Optional(t.Union([t.String(), t.Null()])),
})
export type UpdateProfileBody = typeof UpdateProfileSchema.static

export const VerifyEmailSchema = t.Object({
  code: t.String(),
})
export type VerifyEmailBody = typeof VerifyEmailSchema.static

export const EnableTwoFactorSchema = t.Object({
  secret: t.String(),
  code: t.String(),
})
export type EnableTwoFactorBody = typeof EnableTwoFactorSchema.static

export const ShortLinkCreateSchema = t.Object({
  url: t.String(),
})
export type ShortLinkCreateBody = typeof ShortLinkCreateSchema.static
