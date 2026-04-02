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
  recipientId: t.Number(),
  content: t.Optional(t.String()),
  sharedPostId: t.Optional(t.Number()),
  sharedImageId: t.Optional(t.Number()),
})
export type MessageSendBody = typeof MessageSendSchema.static

export const UpdateProfileSchema = t.Object({
  bio: t.Optional(t.Union([t.String(), t.Null()])),
  avatarUrl: t.Optional(t.Union([t.String(), t.Null()])),
  bannerUrl: t.Optional(t.Union([t.String(), t.Null()])),
  subscriptionState: t.Optional(t.Union([t.String(), t.Null()])),
  color: t.Optional(t.Union([t.String(), t.Null()])),
})
export type UpdateProfileBody = typeof UpdateProfileSchema.static
