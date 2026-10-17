import { t } from 'elysia'

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
