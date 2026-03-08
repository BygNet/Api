const DEFAULT_WEB_BASE = 'https://byg.a35.dev'
const MENTION_REGEX = /(^|[^\w\/])@(\S{1,64})/g

function normalizedWebBase(): string {
  const value = process.env.BASE_URL ?? DEFAULT_WEB_BASE
  return value.replace(/\/+$/, '')
}

export function extractMentionUsernames(content: string): string[] {
  const found = new Set<string>()

  content.replace(
    MENTION_REGEX,
    (_match: string, _prefix: string, username: string) => {
      found.add(username.toLowerCase())
      return _match
    }
  )

  return [ ...found ]
}

export function expandMentionsToMarkdownLinks(content: string): string {
  const webBase = normalizedWebBase()

  return content.replace(
    MENTION_REGEX,
    (_match: string, prefix: string, username: string) => {
      return `${prefix}[@${username}](${webBase}/u/${encodeURIComponent(username)})`
    }
  )
}
