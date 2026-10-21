import { Buffer } from 'node:buffer'

import type { OAuthProvider, OAuthProfile } from '../types'

const AUTHORIZE_URL = 'https://oauth.yandex.com/authorize'
const TOKEN_URL = 'https://oauth.yandex.com/token'
const INFO_URL = 'https://login.yandex.ru/info?format=json'

function credentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.YANDEX_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.YANDEX_OAUTH_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function fetchProfile(accessToken: string): Promise<OAuthProfile> {
  const profileResponse = await fetch(INFO_URL, {
    headers: { Authorization: `OAuth ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  })

  if (!profileResponse.ok) {
    throw new Error(`Yandex profile request failed (${profileResponse.status})`)
  }

  const profile = (await profileResponse.json()) as Record<string, unknown>
  const providerAccountId = requiredString(profile.id)
  if (!providerAccountId) throw new Error('Yandex profile has no account id')

  const firstName = requiredString(profile.first_name)
  const lastName = requiredString(profile.last_name)
  const displayName =
    (requiredString(profile.display_name) ??
      requiredString(profile.real_name) ??
      [firstName, lastName].filter(Boolean).join(' ')) ||
    null

  return {
    providerAccountId,
    username: requiredString(profile.login),
    email:
      requiredString(profile.default_email) ?? requiredString(profile.email),
    displayName,
    avatarUrl: null,
  }
}

export const yandexProvider: OAuthProvider = {
  id: 'yandex',
  label: 'Yandex',
  icon: 'solar:login-2-line-duotone',
  get clientId() {
    return credentials()?.clientId ?? null
  },
  scopes: ['login:info', 'login:email'],
  isConfigured: () => !!credentials(),
  buildAuthorizationUrl({ state, redirectUri, codeChallenge }) {
    const configured = credentials()
    if (!configured) throw new Error('Yandex OAuth is not configured')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: configured.clientId,
      redirect_uri: redirectUri,
      scope: yandexProvider.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    return `${AUTHORIZE_URL}?${params.toString()}`
  },
  async exchangeCode({
    code,
    redirectUri,
    codeVerifier,
  }): Promise<OAuthProfile> {
    const configured = credentials()
    if (!configured) throw new Error('Yandex OAuth is not configured')

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${configured.clientId}:${configured.clientSecret}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`Yandex token exchange failed (${response.status})`)
    }

    const tokenBody = (await response.json()) as { access_token?: unknown }
    const accessToken = requiredString(tokenBody.access_token)
    if (!accessToken) throw new Error('Yandex did not return an access token')

    return await fetchProfile(accessToken)
  },
  async exchangeAccessToken(accessToken: string): Promise<OAuthProfile> {
    if (!credentials()) throw new Error('Yandex OAuth is not configured')
    return await fetchProfile(accessToken)
  },
}
