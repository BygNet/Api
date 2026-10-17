import { t } from 'elysia'

export const MessageSendSchema = t.Object({
  conversationId: t.Optional(t.Number()),
  recipientId: t.Optional(t.Number()),
  content: t.Optional(t.String()),
  sharedPostId: t.Optional(t.Number()),
  sharedImageId: t.Optional(t.Number()),
  replyToMessageId: t.Optional(t.Number()),
})
export type MessageSendBody = typeof MessageSendSchema.static

export const MessageReadSchema = t.Object({
  messageId: t.Optional(t.Number()),
})

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
