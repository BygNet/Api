import { Buffer } from 'node:buffer'
import { createHash, randomBytes } from 'node:crypto'

import { and, eq, gt, ilike, isNull, sql } from 'drizzle-orm'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

import { AuthController } from '@/auth/controller'
import { verifyTotpCode } from '@/auth/security'
import { data } from '@/data/client'
import { oauthAccounts, oauthGrants, users } from '@/data/tables'
import { logger } from '@/observability/logger'
import { getPrimaryWebBase } from '@/utils/webBase'
import { getConfiguredOAuthProviders, getOAuthProvider } from './providers'
import type { OAuthAction, OAuthProfile } from './types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const STATE_TTL = '10m'
const GRANT_TTL_MS = 1000 * 60 * 5
const CALLBACK_PATH = '/oauth/callback'

interface OAuthState {
  purpose: 'oauth'
  provider: string
  action: OAuthAction
  nonce: string
  redirectUri: string
  providerRedirectUri: string
  userId?: number
  codeVerifier: string
}

export interface OAuthProviderSummary {
  id: string
  label: string
  icon: string
  clientId: string | null
}

export interface OAuthAccountSummary {
  provider: string
  username: string | null
  createdAt: string
}

function providerCallbackUri(providerId: string): string {
  const configured = process.env.YANDEX_OAUTH_REDIRECT_URI?.trim()
  const apiBase =
    process.env.API_PUBLIC_BASE_URL?.trim() || 'https://api.byg.a35.dev'
  return configured || `${apiBase}/auth/oauth/${providerId}/callback`
}

function createCodeVerifier(): string {
  return Buffer.from(randomBytes(32)).toString('base64url')
}

function createCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

function createState(input: Omit<OAuthState, 'purpose'>): string {
  return jwt.sign({ purpose: 'oauth', ...input }, JWT_SECRET, {
    expiresIn: STATE_TTL,
  })
}

function readState(value: string): OAuthState | null {
  try {
    const payload = jwt.verify(value, JWT_SECRET) as Partial<OAuthState>
    if (
      payload.purpose !== 'oauth' ||
      typeof payload.provider !== 'string' ||
      (payload.action !== 'signin' && payload.action !== 'link') ||
      typeof payload.nonce !== 'string' ||
      typeof payload.redirectUri !== 'string' ||
      typeof payload.providerRedirectUri !== 'string' ||
      typeof payload.codeVerifier !== 'string'
    ) {
      return null
    }
    return payload as OAuthState
  } catch {
    return null
  }
}

function profileDisplayName(profile: OAuthProfile): string | null {
  return profile.displayName?.trim() || null
}

function usernameBase(profile: OAuthProfile, email: string): string {
  const value = profile.username || email.split('@')[0] || 'yandex-user'
  const normalized = value
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .slice(0, 32)
  return normalized || 'yandex-user'
}

async function uniqueUsername(
  profile: OAuthProfile,
  email: string
): Promise<string> {
  const base = usernameBase(profile, email)
  let candidate = base
  let suffix = 2

  while (
    await data.query.users.findFirst({
      where: ilike(users.username, candidate),
    })
  ) {
    const suffixValue = `-${suffix}`
    candidate = `${base.slice(0, 32 - suffixValue.length)}${suffixValue}`
    suffix += 1
  }

  return candidate
}

function redirectWithError(state: OAuthState, error: string): Response {
  const url = new URL(state.redirectUri)
  url.searchParams.set('provider', state.provider)
  url.searchParams.set('action', state.action)
  url.searchParams.set('state', state.nonce)
  url.searchParams.set('oauth_error', error)
  return Response.redirect(url.toString(), 302)
}

export class OAuthService {
  static providers(): OAuthProviderSummary[] {
    return getConfiguredOAuthProviders().map(provider => ({
      id: provider.id,
      label: provider.label,
      icon: provider.icon,
      clientId: provider.clientId ?? null,
    }))
  }

  static async start(input: {
    providerId: string
    action: OAuthAction
    nonce: string
    userId: number | null
  }): Promise<{ authorizationUrl: string } | null> {
    const provider = getOAuthProvider(input.providerId)
    if (!provider || !provider.isConfigured()) return null
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(input.nonce)) return null
    if (input.action === 'link' && !input.userId) return null

    const codeVerifier = createCodeVerifier()
    const redirectUri = `${getPrimaryWebBase()}${CALLBACK_PATH}`
    const providerRedirectUri = providerCallbackUri(provider.id)
    const state = createState({
      provider: provider.id,
      action: input.action,
      nonce: input.nonce,
      redirectUri,
      providerRedirectUri,
      ...(input.userId ? { userId: input.userId } : {}),
      codeVerifier,
    })

    return {
      authorizationUrl: provider.buildAuthorizationUrl({
        state,
        redirectUri: providerRedirectUri,
        codeChallenge: createCodeChallenge(codeVerifier),
      }),
    }
  }

  static async callback(input: {
    providerId: string
    code?: string
    state?: string
    error?: string
  }): Promise<Response> {
    const state = input.state ? readState(input.state) : null
    if (!state || state.provider !== input.providerId) {
      return Response.redirect(
        `${getPrimaryWebBase()}${CALLBACK_PATH}?oauth_error=invalid_state`,
        302
      )
    }

    const provider = getOAuthProvider(state.provider)
    if (!provider || !provider.isConfigured()) {
      return redirectWithError(state, 'provider_unavailable')
    }
    if (input.error) return redirectWithError(state, 'access_denied')
    if (!input.code) return redirectWithError(state, 'missing_code')

    try {
      const profile = await provider.exchangeCode({
        code: input.code,
        redirectUri: state.providerRedirectUri,
        codeVerifier: state.codeVerifier,
      })

      const code = crypto.randomUUID()
      await data.insert(oauthGrants).values({
        code,
        provider: state.provider,
        action: state.action,
        userId: state.userId ?? null,
        providerAccountId: profile.providerAccountId,
        providerUsername: profile.username,
        email: profile.email,
        displayName: profileDisplayName(profile),
        avatarUrl: profile.avatarUrl,
        expiresAt: new Date(Date.now() + GRANT_TTL_MS),
      })

      const url = new URL(state.redirectUri)
      url.searchParams.set('provider', state.provider)
      url.searchParams.set('action', state.action)
      url.searchParams.set('state', state.nonce)
      url.searchParams.set('code', code)
      return Response.redirect(url.toString(), 302)
    } catch (error: unknown) {
      logger.warn('auth.oauth_callback_failed', {
        provider: state.provider,
        error: error instanceof Error ? error.message : String(error),
      })
      return redirectWithError(state, 'provider_request_failed')
    }
  }

  static async exchange(input: {
    code: string
    providerId: string
    action: OAuthAction
    userId: number | null
    twoFactorCode?: string
    request: Request
    set: { status: number | string }
  }): Promise<unknown> {
    const grant = await data.query.oauthGrants.findFirst({
      where: and(
        eq(oauthGrants.code, input.code),
        eq(oauthGrants.provider, input.providerId),
        eq(oauthGrants.action, input.action),
        isNull(oauthGrants.usedAt),
        gt(oauthGrants.expiresAt, new Date())
      ),
    })

    if (!grant) {
      input.set.status = 400
      return null
    }

    if (input.action === 'link') {
      if (!input.userId || grant.userId !== input.userId) {
        input.set.status = 401
        return null
      }

      const linked = await this.linkAccount(input.userId, grant, input.set)
      if (!linked) return null
      await markGrantUsed(input.code)
      return { status: 'ok', account: linked }
    }

    const existingAccount = await data.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, grant.provider),
        eq(oauthAccounts.providerAccountId, grant.providerAccountId)
      ),
    })

    let user = existingAccount
      ? await data.query.users.findFirst({
          where: eq(users.id, existingAccount.userId),
        })
      : null

    if (!user && grant.email) {
      user = await data.query.users.findFirst({
        where: sql`lower(${users.email}) = lower(${grant.email})`,
      })
      if (user) {
        input.set.status = 409
        return { error: 'account_exists' }
      }
    }

    if (!user) {
      if (!grant.email) {
        input.set.status = 422
        return { error: 'email_required' }
      }

      const profile: OAuthProfile = {
        providerAccountId: grant.providerAccountId,
        username: grant.providerUsername,
        email: grant.email,
        displayName: grant.displayName,
        avatarUrl: grant.avatarUrl,
      }
      const username = await uniqueUsername(profile, grant.email)
      const passHash = await argon2.hash(
        `${crypto.randomUUID()}-${crypto.randomUUID()}`
      )
      const inserted = await data
        .insert(users)
        .values({
          email: grant.email,
          username,
          passHash,
          passwordSet: false,
          emailVerificationCode: null,
          displayName: grant.displayName,
          avatarUrl: grant.avatarUrl,
        })
        .returning()
      user = inserted[0] ?? null
      if (!user) {
        input.set.status = 500
        return null
      }

      await data.insert(oauthAccounts).values({
        userId: user.id,
        provider: grant.provider,
        providerAccountId: grant.providerAccountId,
        providerUsername: grant.providerUsername,
      })
    }

    if (!user) {
      input.set.status = 401
      return null
    }

    if (user.twoFactorSecret) {
      const valid =
        typeof input.twoFactorCode === 'string' &&
        verifyTotpCode(user.twoFactorSecret, input.twoFactorCode)
      if (!valid) {
        input.set.status = 403
        return { requiresTwoFactor: true }
      }
    }

    if (!(await markGrantUsed(input.code))) {
      input.set.status = 400
      return null
    }
    return await AuthController.createSessionForUser(user.id, input.request)
  }

  static async exchangeAccessToken(input: {
    providerId: string
    accessToken: string
    twoFactorCode?: string
    request: Request
    set: { status: number | string }
  }): Promise<unknown> {
    const provider = getOAuthProvider(input.providerId)
    if (!provider?.isConfigured() || !provider.exchangeAccessToken) {
      input.set.status = 400
      return null
    }

    try {
      const profile = await provider.exchangeAccessToken(input.accessToken)
      const code = crypto.randomUUID()
      await data.insert(oauthGrants).values({
        code,
        provider: provider.id,
        action: 'signin',
        providerAccountId: profile.providerAccountId,
        providerUsername: profile.username,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        expiresAt: new Date(Date.now() + GRANT_TTL_MS),
      })

      return await this.exchange({
        code,
        providerId: provider.id,
        action: 'signin',
        userId: null,
        twoFactorCode: input.twoFactorCode,
        request: input.request,
        set: input.set,
      })
    } catch (error: unknown) {
      logger.warn('auth.oauth_token_exchange_failed', {
        provider: input.providerId,
        error: error instanceof Error ? error.message : String(error),
      })
      input.set.status = 401
      return null
    }
  }

  static async accounts(userId: number): Promise<OAuthAccountSummary[]> {
    const accounts = await data
      .select({
        provider: oauthAccounts.provider,
        username: oauthAccounts.providerUsername,
        createdAt: oauthAccounts.createdAt,
      })
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, userId))

    return accounts.map(
      (account: {
        provider: string
        username: string | null
        createdAt: Date
      }) => ({
        provider: account.provider,
        username: account.username,
        createdAt: account.createdAt.toISOString(),
      })
    )
  }

  static async unlink(
    userId: number,
    providerId: string,
    set: { status: number | string }
  ): Promise<{ status: 'ok' } | null> {
    const user = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })
    const account = await data.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, providerId)
      ),
    })
    if (!user || !account) {
      set.status = 404
      return null
    }

    const linkedAccounts = await data
      .select({ id: oauthAccounts.id })
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, userId))
    if (!user.passwordSet && linkedAccounts.length <= 1) {
      set.status = 409
      return null
    }

    await data.delete(oauthAccounts).where(eq(oauthAccounts.id, account.id))
    return { status: 'ok' }
  }

  private static async linkAccount(
    userId: number,
    grant: typeof oauthGrants.$inferSelect,
    set: { status: number | string }
  ): Promise<OAuthAccountSummary | null> {
    const existing = await data.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, grant.provider),
        eq(oauthAccounts.providerAccountId, grant.providerAccountId)
      ),
    })
    if (existing && existing.userId !== userId) {
      set.status = 409
      return null
    }
    if (existing) {
      return {
        provider: existing.provider,
        username: existing.providerUsername,
        createdAt: existing.createdAt.toISOString(),
      }
    }

    try {
      const inserted = await data
        .insert(oauthAccounts)
        .values({
          userId,
          provider: grant.provider,
          providerAccountId: grant.providerAccountId,
          providerUsername: grant.providerUsername,
        })
        .returning()
      const account = inserted[0]
      return account
        ? {
            provider: account.provider,
            username: account.providerUsername,
            createdAt: account.createdAt.toISOString(),
          }
        : null
    } catch {
      set.status = 409
      return null
    }
  }
}

async function markGrantUsed(code: string): Promise<boolean> {
  const updated = await data
    .update(oauthGrants)
    .set({ usedAt: new Date() })
    .where(and(eq(oauthGrants.code, code), isNull(oauthGrants.usedAt)))
    .returning({ code: oauthGrants.code })
  return updated.length > 0
}
