import type { BygSongLinkInfo, BygSongLinkPlatformLink } from '@/types'

const SONG_LINK_FETCH_TIMEOUT_MS = 10_000
const MAX_HTML_LENGTH = 1_000_000
const SONG_LINK_HOSTS = new Set([
  'song.link',
  'www.song.link',
  'odesli.co',
  'www.odesli.co',
])

type JsonObject = Record<string, unknown>

interface SongLinkNextData {
  props?: {
    pageProps?: {
      pageData?: unknown
    }
  }
}

export class SongLinkFetchError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as JsonObject
}

function isSongLinkHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase()
  return SONG_LINK_HOSTS.has(normalizedHost)
}

function normalizeSongLinkInputUrl(rawUrl: string): URL {
  const normalized = rawUrl.trim()
  if (!normalized) {
    throw new SongLinkFetchError(400, 'invalid_url')
  }

  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    throw new SongLinkFetchError(400, 'invalid_url')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SongLinkFetchError(400, 'invalid_url')
  }

  if (!isSongLinkHost(url.hostname)) {
    throw new SongLinkFetchError(400, 'invalid_song_link_domain')
  }

  return url
}

function normalizeHttpUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function extractNextDataPayload(html: string): SongLinkNextData | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
  )
  if (!match?.[1]) return null

  try {
    return JSON.parse(match[1]) as SongLinkNextData
  } catch {
    return null
  }
}

function extractSectionLinks(sections: unknown): BygSongLinkPlatformLink[] {
  if (!Array.isArray(sections)) return []

  const links: BygSongLinkPlatformLink[] = []
  const seen = new Set<string>()

  for (const section of sections) {
    const sectionObj = asObject(section)
    const sectionLinks = sectionObj?.links
    if (!Array.isArray(sectionLinks)) continue

    for (const rawLink of sectionLinks) {
      const linkObj = asObject(rawLink)
      if (!linkObj) continue

      const platform = asString(linkObj.platform)
      const displayName = asString(linkObj.displayName)
      const url = normalizeHttpUrl(asString(linkObj.url))
      if (!platform || !displayName || !url) continue

      const dedupeKey = `${platform.toLowerCase()}::${url}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      links.push({
        platform,
        displayName,
        url,
      })
    }
  }

  return links
}

function firstMediaSection(sections: unknown): JsonObject | null {
  if (!Array.isArray(sections)) return null

  for (const section of sections) {
    const sectionObj = asObject(section)
    if (!sectionObj) continue

    if (
      asString(sectionObj.title) ||
      asString(sectionObj.artistName) ||
      asString(sectionObj.thumbnailUrl)
    ) {
      return sectionObj
    }
  }

  return null
}

export abstract class SongLinkController {
  static async getSongLinkInfo(rawUrl: string): Promise<BygSongLinkInfo> {
    const targetUrl = normalizeSongLinkInputUrl(rawUrl)
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, SONG_LINK_FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': 'Byg Song Link Bot/1.0',
        },
        redirect: 'follow',
      })

      if (!res.ok) {
        throw new SongLinkFetchError(502, 'song_link_fetch_failed')
      }

      const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml')
      ) {
        throw new SongLinkFetchError(415, 'unsupported_content_type')
      }

      const html = (await res.text()).slice(0, MAX_HTML_LENGTH)
      const nextData = extractNextDataPayload(html)
      const pageData = asObject(nextData?.props?.pageProps?.pageData)

      if (!pageData) {
        throw new SongLinkFetchError(422, 'song_link_data_not_found')
      }

      const entityData = asObject(pageData.entityData)
      const primarySection = firstMediaSection(pageData.sections)
      const links = extractSectionLinks(pageData.sections)

      const title =
        asString(entityData?.title) ?? asString(primarySection?.title)
      const artistName =
        asString(entityData?.artistName) ?? asString(primarySection?.artistName)
      const thumbnailUrl =
        normalizeHttpUrl(asString(entityData?.thumbnailUrl)) ??
        normalizeHttpUrl(asString(primarySection?.thumbnailUrl))

      if (!title && !artistName && links.length < 1) {
        throw new SongLinkFetchError(422, 'song_link_data_not_found')
      }

      return {
        requestedUrl: targetUrl.toString(),
        finalUrl: normalizeHttpUrl(res.url) ?? targetUrl.toString(),
        pageUrl: normalizeHttpUrl(asString(pageData.pageUrl)),
        pageId: asString(pageData.pageId),
        entityUniqueId: asString(pageData.entityUniqueId),
        title,
        artistName,
        thumbnailUrl,
        links,
      }
    } catch (error: unknown) {
      if (error instanceof SongLinkFetchError) {
        throw error
      }

      if ((error as { name?: string }).name === 'AbortError') {
        throw new SongLinkFetchError(504, 'song_link_fetch_timeout')
      }

      throw new SongLinkFetchError(502, 'song_link_fetch_failed')
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
