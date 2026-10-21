export type OAuthAction = 'signin' | 'link'

export interface OAuthProfile {
  providerAccountId: string
  username: string | null
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

export interface OAuthProvider {
  id: string
  label: string
  icon: string
  clientId?: string | null
  scopes: string[]
  isConfigured(): boolean
  buildAuthorizationUrl(input: {
    state: string
    redirectUri: string
    codeChallenge: string
  }): string
  exchangeCode(input: {
    code: string
    redirectUri: string
    codeVerifier: string
  }): Promise<OAuthProfile>
  exchangeAccessToken?(accessToken: string): Promise<OAuthProfile>
}
