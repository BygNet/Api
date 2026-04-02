const HEAD_FETCH_TIMEOUT_MS = 10_000
const MAX_HEAD_SCAN_LENGTH = 200_000

interface HeadMetaTag {
  name: string | null
  property: string | null
  httpEquiv: string | null
  charset: string | null
  content: string | null
}

interface HeadLinkTag {
  rel: string | null
  href: string | null
  type: string | null
  sizes: string | null
  title: string | null
  hreflang: string | null
  media: string | null
}

interface HeadScriptTag {
  type: string | null
  src: string | null
  content: string | null
}

export interface HeadTagsResponse {
  url: string
  finalUrl: string
  title: string | null
  lang: string | null
  charset: string | null
  viewport: string | null
  description: string | null
  canonicalUrl: string | null
  openGraph: Record<string, string>
  twitter: Record<string, string>
  meta: HeadMetaTag[]
  links: HeadLinkTag[]
  icons: string[]
  alternates: string[]
  scripts: HeadScriptTag[]
  rawHead: string | null
}

export class HeadFetchError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code))
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16))
    )
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ')
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null

  const normalized = decodeHtmlEntities(stripTags(value))
    .replace(/\s+/g, ' ')
    .trim()

  return normalized.length > 0 ? normalized : null
}

function normalizeAttr(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = decodeHtmlEntities(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

function extractAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const attributePattern =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

  for (const match of tag.matchAll(attributePattern)) {
    const key = match[1]?.toLowerCase()
    if (!key) continue
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    attributes[key] = value
  }

  return attributes
}

function resolveUrl(value: string | null, baseUrl: string): string | null {
  if (!value) return null

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

function extractHeadBlock(html: string): string | null {
  const limitedHtml = html.slice(0, MAX_HEAD_SCAN_LENGTH)
  const match = limitedHtml.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
  return match?.[1] ?? null
}

function extractTitle(head: string): string | null {
  const match = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  return normalizeText(match?.[1])
}

function extractHtmlLang(html: string): string | null {
  const match = html.match(/<html\b([^>]*)>/i)
  if (!match?.[1]) return null
  const attrs = extractAttributes(match[1])
  return normalizeAttr(attrs.lang)
}

function mapMetaTags(head: string): HeadMetaTag[] {
  const results: HeadMetaTag[] = []

  for (const match of head.matchAll(/<meta\b([^>]*?)\/?>/gi)) {
    const attrs = extractAttributes(match[1] ?? '')

    results.push({
      name: normalizeAttr(attrs.name),
      property: normalizeAttr(attrs.property),
      httpEquiv: normalizeAttr(attrs['http-equiv']),
      charset: normalizeAttr(attrs.charset),
      content: normalizeAttr(attrs.content),
    })
  }

  return results
}

function mapLinkTags(head: string, baseUrl: string): HeadLinkTag[] {
  const results: HeadLinkTag[] = []

  for (const match of head.matchAll(/<link\b([^>]*?)\/?>/gi)) {
    const attrs = extractAttributes(match[1] ?? '')

    results.push({
      rel: normalizeAttr(attrs.rel),
      href: resolveUrl(normalizeAttr(attrs.href), baseUrl),
      type: normalizeAttr(attrs.type),
      sizes: normalizeAttr(attrs.sizes),
      title: normalizeAttr(attrs.title),
      hreflang: normalizeAttr(attrs.hreflang),
      media: normalizeAttr(attrs.media),
    })
  }

  return results
}

function mapScriptTags(head: string): HeadScriptTag[] {
  const results: HeadScriptTag[] = []

  for (const match of head.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  )) {
    const attrs = extractAttributes(match[1] ?? '')
    const type = normalizeAttr(attrs.type)
    const src = normalizeAttr(attrs.src)
    const content = normalizeText(match[2])

    if (!src && !content) continue

    results.push({
      type,
      src,
      content: type === 'application/ld+json' ? content : null,
    })
  }

  return results
}

function pickMetaContent(
  meta: HeadMetaTag[],
  predicate: (tag: HeadMetaTag) => boolean
): string | null {
  const match = meta.find(predicate)
  return match?.content ?? match?.charset ?? null
}

function groupMetaByPrefix(
  meta: HeadMetaTag[],
  prefix: string
): Record<string, string> {
  const grouped: Record<string, string> = {}

  for (const tag of meta) {
    const key = tag.property ?? tag.name
    const value = tag.content

    if (!key || !value) continue
    if (!key.toLowerCase().startsWith(prefix)) continue

    grouped[key] = value
  }

  return grouped
}

export abstract class HeadController {
  static async getHeadTags(url: string): Promise<HeadTagsResponse> {
    const normalizedUrl = url.trim()
    if (!normalizedUrl) {
      throw new HeadFetchError(400, 'invalid_url')
    }

    let targetUrl: URL
    try {
      targetUrl = new URL(normalizedUrl)
    } catch {
      throw new HeadFetchError(400, 'invalid_url')
    }

    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      throw new HeadFetchError(400, 'invalid_url')
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, HEAD_FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': 'Byg Metadata Bot/1.0',
        },
        redirect: 'follow',
      })

      if (!res.ok) {
        throw new HeadFetchError(502, 'head_fetch_failed')
      }

      const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml')
      ) {
        throw new HeadFetchError(415, 'unsupported_content_type')
      }

      const html = await res.text()
      const head = extractHeadBlock(html)

      if (!head) {
        throw new HeadFetchError(422, 'head_not_found')
      }

      const finalUrl = res.url || targetUrl.toString()
      const meta = mapMetaTags(head)
      const links = mapLinkTags(head, finalUrl)
      const scripts = mapScriptTags(head)

      return {
        url: targetUrl.toString(),
        finalUrl,
        title: extractTitle(head),
        lang: extractHtmlLang(html),
        charset:
          pickMetaContent(meta, tag => tag.charset != null) ??
          res.headers.get('content-type')?.match(/charset=([^;]+)/i)?.[1] ??
          null,
        viewport: pickMetaContent(
          meta,
          tag => tag.name?.toLowerCase() === 'viewport'
        ),
        description: pickMetaContent(
          meta,
          tag => tag.name?.toLowerCase() === 'description'
        ),
        canonicalUrl:
          links.find(link => link.rel?.toLowerCase() === 'canonical')?.href ??
          null,
        openGraph: groupMetaByPrefix(meta, 'og:'),
        twitter: groupMetaByPrefix(meta, 'twitter:'),
        meta,
        links,
        icons: links
          .filter(link => link.rel?.toLowerCase().includes('icon'))
          .map(link => link.href)
          .filter((href): href is string => !!href),
        alternates: links
          .filter(link => link.rel?.toLowerCase().includes('alternate'))
          .map(link => link.href)
          .filter((href): href is string => !!href),
        scripts,
        rawHead: normalizeText(head),
      }
    } catch (error: unknown) {
      if (error instanceof HeadFetchError) {
        throw error
      }

      if ((error as { name?: string }).name === 'AbortError') {
        throw new HeadFetchError(504, 'head_fetch_timeout')
      }

      throw new HeadFetchError(502, 'head_fetch_failed')
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
