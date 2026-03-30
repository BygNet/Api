import type {
  BygSearchCategory,
  BygSearchResponse,
  BygSearchResult,
} from '@/types'

const SEARCH_TIMEOUT_MS = 10_000
const SEARCH_PAGE_MIN = 1
const SEARCH_PAGE_MAX = 25
const SEARCH_SAFESEARCH_MIN = 0
const SEARCH_SAFESEARCH_MAX = 2
const SEARCH_QUERY_MAX_LENGTH = 400

const categoryToSearxCategory: Record<BygSearchCategory, string> = {
  web: 'general',
  images: 'images',
  videos: 'videos',
  news: 'news',
  music: 'music',
  files: 'files',
  science: 'science',
  social: 'social media',
}

type BygSearchTimeRange = 'day' | 'month' | 'year'

interface BygSearchRequest {
  query: string
  category: BygSearchCategory
  page: number
  language?: string
  safeSearch: number
  timeRange?: BygSearchTimeRange
}

interface SearxSearchResult {
  title?: unknown
  url?: unknown
  content?: unknown
  engine?: unknown
  engines?: unknown
  category?: unknown
  img_src?: unknown
  thumbnail?: unknown
  publishedDate?: unknown
  score?: unknown
}

interface SearxSearchResponse {
  query?: unknown
  number_of_results?: unknown
  results?: unknown
  suggestions?: unknown
  answers?: unknown
}

class SearchProxyError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

function sanitizeString(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const normalized = input.trim()
  return normalized.length > 0 ? normalized : null
}

function sanitizeStringList(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .map(item => sanitizeString(item))
    .filter((item): item is string => !!item)
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeResult(raw: SearxSearchResult): BygSearchResult | null {
  const url = sanitizeString(raw.url)
  if (!url) return null

  const title = sanitizeString(raw.title) ?? url
  const snippet = sanitizeString(raw.content) ?? ''
  const engine = sanitizeString(raw.engine)
  const engines = sanitizeStringList(raw.engines)
  const category = sanitizeString(raw.category)
  const thumbnailUrl =
    sanitizeString(raw.thumbnail) ?? sanitizeString(raw.img_src)
  const publishedDate = sanitizeString(raw.publishedDate)
  const score = Number.isFinite(Number(raw.score)) ? Number(raw.score) : null

  return {
    title,
    url,
    snippet,
    engine,
    engines,
    category,
    thumbnailUrl,
    publishedDate,
    score,
  }
}

function normalizeResults(input: unknown): BygSearchResult[] {
  if (!Array.isArray(input)) return []

  return input
    .map(item => sanitizeResult(item as SearxSearchResult))
    .filter((item): item is BygSearchResult => !!item)
}

export abstract class SearchController {
  static normalizeCategory(rawCategory: string | undefined): BygSearchCategory {
    const normalized = rawCategory?.trim().toLowerCase()

    switch (normalized) {
      case 'images':
      case 'videos':
      case 'news':
      case 'music':
      case 'files':
      case 'science':
      case 'social':
      case 'web':
        return normalized
      default:
        return 'web'
    }
  }

  static normalizePage(rawPage: string | undefined): number {
    const parsed = Number(rawPage)
    if (!Number.isFinite(parsed)) return SEARCH_PAGE_MIN

    const normalized = Math.trunc(parsed)
    return Math.max(SEARCH_PAGE_MIN, Math.min(SEARCH_PAGE_MAX, normalized))
  }

  static normalizeSafeSearch(rawValue: string | undefined): number {
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) return 1

    const normalized = Math.trunc(parsed)
    return Math.max(
      SEARCH_SAFESEARCH_MIN,
      Math.min(SEARCH_SAFESEARCH_MAX, normalized)
    )
  }

  static normalizeTimeRange(
    rawTimeRange: string | undefined
  ): BygSearchTimeRange | undefined {
    const normalized = rawTimeRange?.trim().toLowerCase()
    if (
      normalized === 'day' ||
      normalized === 'month' ||
      normalized === 'year'
    ) {
      return normalized
    }
    return undefined
  }

  static async search(request: BygSearchRequest): Promise<BygSearchResponse> {
    const normalizedQuery = request.query
      .trim()
      .slice(0, SEARCH_QUERY_MAX_LENGTH)
    if (!normalizedQuery) {
      throw new SearchProxyError(400, 'invalid_query')
    }

    const configuredBase = process.env.SEARXNG_BASE_URL
    let endpoint: URL
    try {
      endpoint = new URL('/search', configuredBase)
    } catch {
      throw new SearchProxyError(503, 'search_proxy_unavailable')
    }

    endpoint.searchParams.set('q', normalizedQuery)
    endpoint.searchParams.set('format', 'json')
    endpoint.searchParams.set(
      'categories',
      categoryToSearxCategory[request.category]
    )
    endpoint.searchParams.set('pageno', String(request.page))
    endpoint.searchParams.set('safesearch', String(request.safeSearch))

    const normalizedLanguage = request.language?.trim()
    if (normalizedLanguage) {
      endpoint.searchParams.set('language', normalizedLanguage)
    }
    if (request.timeRange) {
      endpoint.searchParams.set('time_range', request.timeRange)
    }

    const startedAt = Date.now()
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, SEARCH_TIMEOUT_MS)

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          accept: 'application/json',
          'user-agent': 'Byg Search Proxy/1.0',
        },
      })
      if (!res.ok) {
        throw new SearchProxyError(502, 'search_upstream_failed')
      }

      const payload = (await res.json()) as SearxSearchResponse
      const results = normalizeResults(payload.results)
      const parsedTotalResults = parseOptionalNumber(payload.number_of_results)
      const totalResults =
        (parsedTotalResults === null || parsedTotalResults <= 0) &&
        results.length > 0
          ? results.length
          : parsedTotalResults

      return {
        query: sanitizeString(payload.query) ?? normalizedQuery,
        category: request.category,
        page: request.page,
        totalResults,
        tookMs: Date.now() - startedAt,
        suggestions: sanitizeStringList(payload.suggestions),
        answers: sanitizeStringList(payload.answers),
        results,
      }
    } catch (error: unknown) {
      if (error instanceof SearchProxyError) {
        throw error
      }

      if ((error as { name?: string }).name === 'AbortError') {
        throw new SearchProxyError(502, 'search_upstream_timeout')
      }

      throw new SearchProxyError(502, 'search_upstream_failed')
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export { SearchProxyError }
export type { BygSearchRequest, BygSearchTimeRange }
