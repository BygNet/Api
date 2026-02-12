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
