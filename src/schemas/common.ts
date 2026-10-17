import { t } from 'elysia'

export const StatusSchema = t.Object({
  status: t.String(),
})

export const StringSchema = t.String()

export const EmptySchema = t.Null()

export const AnySchema = t.Any()

export const AnyArraySchema = t.Array(t.Any())

export const HtmlSchema = t.String()

export const ShortLinkSchema = t.Object({
  slug: t.String(),
  url: t.String(),
})

export const PushPublicKeySchema = t.Object({
  publicKey: t.String(),
})
