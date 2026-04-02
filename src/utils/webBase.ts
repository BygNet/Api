const DEFAULT_WEB_BASE = 'https://byg.a35.dev'

function normalizeBaseUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return url.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

export function getConfiguredWebBases(): string[] {
  const rawValue = process.env.BASE_URL ?? import.meta.env.BASE_URL ?? DEFAULT_WEB_BASE

  const configuredBases = rawValue
    .split(',')
    .map(entry => normalizeBaseUrl(entry))
    .filter((entry): entry is string => !!entry)

  if (configuredBases.length > 0) {
    return configuredBases
  }

  return [DEFAULT_WEB_BASE]
}

export function getPrimaryWebBase(): string {
  return getConfiguredWebBases()[0]!
}
