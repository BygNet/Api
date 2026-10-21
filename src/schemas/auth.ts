import { t } from 'elysia'

export const UserSchema = t.Object({
  id: t.Number(),
  email: t.String(),
  username: t.String(),
  displayName: t.Union([t.String(), t.Null()]),
  pronouns: t.Union([t.String(), t.Null()]),
  songLinkUrl: t.Union([t.String(), t.Null()]),
  avatarUrl: t.Union([t.String(), t.Null()]),
  bannerUrl: t.Union([t.String(), t.Null()]),
  bio: t.Union([t.String(), t.Null()]),
  subscriptionState: t.Union([t.String(), t.Null()]),
  emailVerificationCode: t.Union([t.String(), t.Null()]),
  twoFactorEnabled: t.Boolean(),
})

export const AuthSuccessSchema = t.Object({
  token: t.String(),
  user: UserSchema,
})

export const TwoFactorChallengeSchema = t.Object({
  requiresTwoFactor: t.Literal(true),
})

export const TwoFactorSetupSchema = t.Object({
  secret: t.String(),
  manualEntryKey: t.String(),
  otpauthUrl: t.String(),
})

export const VerifyEmailSchema = t.Object({
  code: t.String(),
})
export type VerifyEmailBody = typeof VerifyEmailSchema.static

export const AuthGrantSchema = t.Object({
  redirectUri: t.String({ minLength: 1, maxLength: 512 }),
})
export type AuthGrantBody = typeof AuthGrantSchema.static

export const SessionExpirySchema = t.Object({
  neverExpire: t.Boolean(),
})
export type SessionExpiryBody = typeof SessionExpirySchema.static

export const EnableTwoFactorSchema = t.Object({
  secret: t.String(),
  code: t.String(),
})
export type EnableTwoFactorBody = typeof EnableTwoFactorSchema.static

export const OAuthStartQuerySchema = t.Object({
  action: t.Optional(t.Union([t.Literal('signin'), t.Literal('link')])),
  nonce: t.String({ minLength: 16, maxLength: 128 }),
})

export const OAuthExchangeSchema = t.Object({
  code: t.String({ minLength: 1 }),
  action: t.Union([t.Literal('signin'), t.Literal('link')]),
  twoFactorCode: t.Optional(t.String()),
})

export const OAuthTokenSchema = t.Object({
  accessToken: t.String({ minLength: 1, maxLength: 4096 }),
  twoFactorCode: t.Optional(t.String()),
})
