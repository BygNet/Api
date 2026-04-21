import { ShortLinksQueries } from '@/shortLinks/queries'

const SLUG_LENGTH = 7
const MAX_SLUG_ATTEMPTS = 8
const SLUG_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export interface ShortLinkResponse {
  slug: string
  url: string
}

function normalizeDestinationUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

function generateSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SLUG_LENGTH))
  let slug = ''

  for (let i = 0; i < SLUG_LENGTH; i += 1) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length]!
  }

  return slug
}

export abstract class ShortLinksController {
  static async createShortLink(
    rawUrl: string
  ): Promise<ShortLinkResponse | null> {
    const normalizedUrl = normalizeDestinationUrl(rawUrl)
    if (!normalizedUrl) return null

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = generateSlug()
      const created = await ShortLinksQueries.insertShortLink(
        slug,
        normalizedUrl
      )
      if (created) {
        return {
          slug,
          url: normalizedUrl,
        }
      }
    }

    throw new Error('short_link_slug_exhausted')
  }

  static async getShortLink(slug: string): Promise<ShortLinkResponse | null> {
    const record = await ShortLinksQueries.getBySlug(slug)
    if (!record) return null

    return {
      slug: record.slug,
      url: record.destinationUrl,
    }
  }
}
