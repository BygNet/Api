import { t } from 'elysia'

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
