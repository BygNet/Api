import type { OAuthProvider } from '../types'
import { yandexProvider } from './yandex'

const providers: Record<string, OAuthProvider> = {
  yandex: yandexProvider,
}

export function getOAuthProvider(id: string): OAuthProvider | null {
  return providers[id] ?? null
}

export function getConfiguredOAuthProviders(): OAuthProvider[] {
  return Object.values(providers).filter(provider => provider.isConfigured())
}
