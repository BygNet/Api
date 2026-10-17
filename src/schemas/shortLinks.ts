import { t } from 'elysia'

export const ShortLinkCreateSchema = t.Object({
  url: t.String(),
})
export type ShortLinkCreateBody = typeof ShortLinkCreateSchema.static
