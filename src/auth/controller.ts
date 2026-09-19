import { data } from '@/data/client'
import { authGrants, sessions, users } from '@/data/tables'
import { and, eq, gt, isNull, sql, type InferSelectModel } from 'drizzle-orm'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import {
  createTotpProvisioningUri,
  generateEmailVerificationCode,
  generateTwoFactorSecret,
  normalizeOneTimeCode,
  sendEmailVerificationEmail,
  verifyTotpCode,
} from '@/auth/security'
import { logger } from '@/observability/logger'

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev-secret'
const SESSION_TTL_MS: number = 1000 * 60 * 60 * 24 * 30 // 30 days
const AUTH_GRANT_TTL_MS = 1000 * 60 * 5

type SignupBody = {
  email: string
  username: string
  password: string
}

type LoginBody = {
  email: string
  password: string
  twoFactorCode?: string
}

export interface SessionSummary {
  id: string
  createdAt: string
  lastUsedAt: string
  expiresAt: string | null
  ipAddress: string | null
  countryCode: string | null
  countryName: string | null
  deviceLabel: string | null
}

type SessionRow = InferSelectModel<typeof sessions>

interface PublicUser {
  id: number
  email: string
  username: string
  displayName: string | null
  pronouns: string | null
  songLinkUrl: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  subscriptionState: string | null
  emailVerificationCode: string | null
  twoFactorEnabled: boolean
}

interface LoginTwoFactorChallenge {
  requiresTwoFactor: true
}

function getClientIp(request: Request): string | null {
  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // Standard reverse proxy header
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const candidate = forwarded.split(',')[0]?.trim()
    if (candidate) return candidate
  }

  // Other common proxy
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return null
}

function getDeviceLabel(userAgent: string | null): string {
  const value = userAgent ?? ''
  const browser = /Edg\//.test(value)
    ? 'Edge'
    : /Chrome\//.test(value)
      ? 'Chrome'
      : /Firefox\//.test(value)
        ? 'Firefox'
        : /Safari\//.test(value) && !/Chrome\//.test(value)
          ? 'Safari'
          : 'Browser'
  const platform = /iPhone|iPad|iPod/.test(value)
    ? 'iOS'
    : /Android/.test(value)
      ? 'Android'
      : /Mac OS X/.test(value)
        ? 'macOS'
        : /Windows/.test(value)
          ? 'Windows'
          : /Linux/.test(value)
            ? 'Linux'
            : 'Unknown device'
  return `${browser} · ${platform}`
}

async function lookupCountryCode(
  ipAddress: string | null
): Promise<string | null> {
  if (
    !ipAddress ||
    /^(127\.0\.0\.1|::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      ipAddress
    )
  ) {
    return null
  }

  const token = process.env.IPINFO_KEY?.trim()

  if (!token) {
    logger.warn('auth.ipinfo_lookup_skipped', {
      reason: 'missing_ipinfo_key',
    })
    return null
  }

  try {
    const response = await fetch(
      `https://api.ipinfo.io/lite/${encodeURIComponent(ipAddress)}/country_code?token=${encodeURIComponent(token)}`,
      {
        signal: AbortSignal.timeout(1500),
      }
    )

    if (!response.ok) {
      logger.warn('auth.ipinfo_lookup_failed', {
        status: response.status,
        ipAddress,
      })
      return null
    }

    const countryCode = (await response.text()).trim().toUpperCase()

    return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null
  } catch (error: unknown) {
    logger.warn('auth.ipinfo_lookup_error', {
      error,
    })
    return null
  }
}

async function issueSession(
  userId: number,
  request: Request,
  options: { neverExpire?: boolean } = {}
): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = options.neverExpire
    ? null
    : new Date(Date.now() + SESSION_TTL_MS)
  const ipAddress = getClientIp(request)
  const userAgent = request.headers.get('user-agent')

  const countryCode = await lookupCountryCode(ipAddress)

  await data.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    ipAddress,
    countryCode,
    countryName: null,
    userAgent,
    deviceLabel: getDeviceLabel(userAgent),
    lastUsedAt: new Date(),
  })

  const payload: jwt.JwtPayload = {
    sub: userId.toString(),
    sid: sessionId,
  }

  return options.neverExpire
    ? jwt.sign(payload, JWT_SECRET)
    : jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

function publicUser(user: {
  id: number
  email: string
  username: string
  displayName: string | null
  pronouns: string | null
  songLinkUrl: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  subscriptionState: string | null
  emailVerificationCode: string | null
  twoFactorSecret: string | null
}): PublicUser {
  return <PublicUser>{
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    pronouns: user.pronouns,
    songLinkUrl: user.songLinkUrl,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    subscriptionState: user.subscriptionState ?? null,
    emailVerificationCode: user.emailVerificationCode ?? null,
    twoFactorEnabled: !!user.twoFactorSecret,
  }
}

export class AuthController {
  static async signup(
    body: SignupBody,
    set: any,
    request: Request
  ): Promise<{ token: string; user: PublicUser } | void> {
    const { email, username, password } = body

    if (!email || !username || !password) {
      set.status = 400
      return
    }

    const existingUser = await data.query.users.findFirst({
      where: sql`lower(${users.username}) = lower(${username})`,
    })

    if (existingUser) {
      set.status = 409
      return
    }

    const passHash: string = await argon2.hash(password)
    const emailVerificationCode = generateEmailVerificationCode()

    try {
      await data.insert(users).values({
        email,
        username,
        passHash,
        emailVerificationCode,
      })
    } catch {
      set.status = 409
      return
    }

    const user = await data.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      set.status = 500
      return
    }

    try {
      await sendEmailVerificationEmail({
        email: user.email,
        username: user.username,
        code: emailVerificationCode,
      })
    } catch (error: unknown) {
      logger.error('auth.signup_verification_email_failed', error, {
        userId: user.id,
        username: user.username,
      })
    }

    const token: string = await issueSession(user.id, request)

    return {
      token,
      user: publicUser(user),
    }
  }

  static async login(
    body: LoginBody,
    set: any,
    request: Request
  ): Promise<
    { token: string; user: PublicUser } | LoginTwoFactorChallenge | void
  > {
    const { email, password, twoFactorCode } = body

    if (!email || !password) {
      set.status = 400
      return
    }

    const user = await data.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      set.status = 401
      return
    }

    const valid: boolean = await argon2.verify(user.passHash, password)
    if (!valid) {
      set.status = 401
      return
    }

    if (user.twoFactorSecret) {
      const validTwoFactorCode =
        typeof twoFactorCode === 'string' &&
        verifyTotpCode(user.twoFactorSecret, twoFactorCode)

      if (!validTwoFactorCode) {
        set.status = 403
        return {
          requiresTwoFactor: true,
        }
      }
    }

    const token: string = await issueSession(user.id, request)

    return {
      token,
      user: publicUser(user),
    }
  }

  static async logout(request: Request, set: any): Promise<void> {
    const auth = request.headers.get('authorization')
    if (!auth) {
      set.status = 204
      return
    }

    try {
      const token: string = auth.replace('Bearer ', '')
      const payload = jwt.verify(token, JWT_SECRET) as any

      await data.delete(sessions).where(eq(sessions.id, payload.sid))
    } catch {
      // ignore
    }

    set.status = 204
    return
  }

  static async me(request: Request, set: any): Promise<PublicUser | void> {
    const auth = request.headers.get('authorization')
    if (!auth) {
      set.status = 401
      return
    }

    try {
      const token: string = auth.replace('Bearer ', '')
      const payload = jwt.verify(token, JWT_SECRET) as any

      const session = await data.query.sessions.findFirst({
        where: eq(sessions.id, payload.sid),
      })

      if (
        !session ||
        (session.expiresAt !== null && session.expiresAt.getTime() < Date.now())
      ) {
        set.status = 401
        return
      }

      const user = await data.query.users.findFirst({
        where: eq(users.id, Number(payload.sub)),
      })

      if (!user) {
        set.status = 401
        return
      }

      return publicUser(user)
    } catch {
      set.status = 401
      return
    }
  }

  static async verifyEmail(userId: number, code: string): Promise<number> {
    const user = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return 404
    }

    if (!user.emailVerificationCode) {
      return 204
    }

    if (
      normalizeOneTimeCode(code) !==
      normalizeOneTimeCode(user.emailVerificationCode)
    ) {
      return 400
    }

    await data
      .update(users)
      .set({
        emailVerificationCode: null,
      })
      .where(eq(users.id, userId))

    return 204
  }

  static async resendEmailVerification(userId: number): Promise<number> {
    const user = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return 404
    }

    if (!user.emailVerificationCode) {
      return 204
    }

    try {
      await sendEmailVerificationEmail({
        email: user.email,
        username: user.username,
        code: user.emailVerificationCode,
      })
    } catch (error: unknown) {
      logger.error('auth.verification_email_resend_failed', error, {
        userId,
        username: user.username,
      })
      return 500
    }

    return 204
  }

  static async createTwoFactorSetup(userId: number): Promise<{
    secret: string
    manualEntryKey: string
    otpauthUrl: string
  } | null> {
    const user = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return null
    }

    const { secret, manualEntryKey } = generateTwoFactorSecret()

    return {
      secret,
      manualEntryKey,
      otpauthUrl: createTotpProvisioningUri({
        email: user.email,
        username: user.username,
        secret,
      }),
    }
  }

  static async enableTwoFactor(
    userId: number,
    secret: string,
    code: string
  ): Promise<PublicUser | null> {
    const user = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return null
    }

    if (!verifyTotpCode(secret, code)) {
      return null
    }

    await data
      .update(users)
      .set({
        twoFactorSecret: secret.replace(/[\s-]+/g, '').toUpperCase(),
      })
      .where(eq(users.id, userId))

    const updatedUser = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })

    return updatedUser ? publicUser(updatedUser) : null
  }

  static async disableTwoFactor(userId: number): Promise<PublicUser | null> {
    await data
      .update(users)
      .set({
        twoFactorSecret: null,
      })
      .where(eq(users.id, userId))

    const updatedUser = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })

    return updatedUser ? publicUser(updatedUser) : null
  }

  static async hash(pass: string): Promise<string> {
    return await argon2.hash(pass)
  }

  static async createGrant(
    userId: number,
    redirectUri: string,
    set: any
  ): Promise<{ code: string; redirectUri: string } | null> {
    if (!isAllowedRedirectUri(redirectUri)) {
      set.status = 400
      return null
    }

    const code = crypto.randomUUID()
    await data.insert(authGrants).values({
      code,
      userId,
      redirectUri,
      expiresAt: new Date(Date.now() + AUTH_GRANT_TTL_MS),
    })
    return { code, redirectUri }
  }

  static async exchangeGrant(
    code: string,
    redirectUri: string,
    request: Request,
    set: any
  ): Promise<{ token: string; user: PublicUser } | null> {
    if (!isAllowedRedirectUri(redirectUri)) {
      set.status = 400
      return null
    }

    const grant = await data.query.authGrants.findFirst({
      where: and(
        eq(authGrants.code, code),
        eq(authGrants.redirectUri, redirectUri),
        isNull(authGrants.usedAt),
        gt(authGrants.expiresAt, new Date())
      ),
    })

    if (!grant) {
      set.status = 400
      return null
    }

    await data
      .update(authGrants)
      .set({ usedAt: new Date() })
      .where(eq(authGrants.code, code))

    const user = await data.query.users.findFirst({
      where: eq(users.id, grant.userId),
    })

    if (!user) {
      set.status = 401
      return null
    }

    return {
      token: await issueSession(user.id, request),
      user: publicUser(user),
    }
  }

  static async getSessions(
    userId: number,
    request: Request
  ): Promise<(SessionSummary & { current: boolean })[]> {
    const currentSessionId = getSessionId(request)
    const rows = await data
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sql`${sessions.lastUsedAt} desc`)

    return (rows as SessionRow[]).map((row: SessionRow) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
      ipAddress: row.ipAddress,
      countryCode: row.countryCode,
      countryName: row.countryName,
      deviceLabel: row.deviceLabel,
      current: row.id === currentSessionId,
    }))
  }

  static async removeSession(
    userId: number,
    sessionId: string,
    set: any
  ): Promise<void> {
    const rows = await data
      .delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning({ id: sessions.id })
    if (rows.length < 1) set.status = 404
  }

  static async setSessionExpiry(
    userId: number,
    sessionId: string,
    neverExpire: boolean,
    request: Request,
    set: any
  ): Promise<{ token?: string; expiresAt: string | null } | null> {
    const expiresAt = neverExpire ? null : new Date(Date.now() + SESSION_TTL_MS)
    const rows = await data
      .update(sessions)
      .set({ expiresAt, lastUsedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning({ id: sessions.id })
    if (rows.length < 1) {
      set.status = 404
      return null
    }

    return {
      expiresAt: expiresAt?.toISOString() ?? null,
      ...(sessionId === getSessionId(request)
        ? { token: await issueReplacementToken(userId, sessionId, neverExpire) }
        : {}),
    }
  }
}

function getSessionId(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization) return null
  try {
    const payload = jwt.verify(
      authorization.replace(/^Bearer\s+/i, ''),
      JWT_SECRET
    ) as jwt.JwtPayload
    return typeof payload.sid === 'string' ? payload.sid : null
  } catch {
    return null
  }
}

async function issueReplacementToken(
  userId: number,
  sessionId: string,
  neverExpire: boolean
): Promise<string> {
  const payload: jwt.JwtPayload = { sub: userId.toString(), sid: sessionId }
  return neverExpire
    ? jwt.sign(payload, JWT_SECRET)
    : jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value)
    const configured = (process.env.AUTH_REDIRECT_URIS ?? '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
    const defaults = [
      'https://chat.byg.gg/auth/callback',
      'http://localhost:2259/auth/callback',
    ]
    return [...defaults, ...configured].includes(url.toString())
  } catch {
    return false
  }
}
