const DEFAULT_WEB_BASE = 'https://byg.a35.dev'
const MENTION_REGEX = /(^|[^\w\/])@(\S{1,64})/g

interface TextRange {
  start: number
  end: number
}

function normalizedWebBase(): string {
  const value = process.env.BASE_URL ?? DEFAULT_WEB_BASE
  return value.replace(/\/+$/, '')
}

function mergeRanges(ranges: TextRange[]): TextRange[] {
  if (ranges.length < 2) return ranges

  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged: TextRange[] = [sorted[0]!]

  for (let index = 1; index < sorted.length; index += 1) {
    const range = sorted[index]
    if (!range) continue

    const previous = merged[merged.length - 1]
    if (!previous) {
      merged.push(range)
      continue
    }

    if (range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end)
      continue
    }

    merged.push(range)
  }

  return merged
}

function findInlineCodeRanges(
  content: string,
  start: number,
  end: number
): TextRange[] {
  const ranges: TextRange[] = []
  let cursor = start

  while (cursor < end) {
    if (content[cursor] !== '`') {
      cursor += 1
      continue
    }

    let delimiterLength = 1
    while (
      cursor + delimiterLength < end &&
      content[cursor + delimiterLength] === '`'
    ) {
      delimiterLength += 1
    }

    let scanCursor = cursor + delimiterLength
    let closingIndex = -1

    while (scanCursor < end) {
      const nextBacktick = content.indexOf('`', scanCursor)
      if (nextBacktick < 0 || nextBacktick >= end) break

      let runLength = 1
      while (
        nextBacktick + runLength < end &&
        content[nextBacktick + runLength] === '`'
      ) {
        runLength += 1
      }

      if (runLength === delimiterLength) {
        closingIndex = nextBacktick
        break
      }

      scanCursor = nextBacktick + runLength
    }

    if (closingIndex < 0) {
      cursor += delimiterLength
      continue
    }

    const rangeEnd = closingIndex + delimiterLength
    ranges.push({
      start: cursor,
      end: rangeEnd,
    })
    cursor = rangeEnd
  }

  return ranges
}

function findMarkdownCodeRanges(content: string): TextRange[] {
  const ranges: TextRange[] = []
  const fencedCodeRegex = /```[\s\S]*?```/g

  let match = fencedCodeRegex.exec(content)
  while (match) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    })
    match = fencedCodeRegex.exec(content)
  }

  const mergedFenced = mergeRanges(ranges)
  let segmentStart = 0

  for (const fencedRange of mergedFenced) {
    if (segmentStart < fencedRange.start) {
      ranges.push(
        ...findInlineCodeRanges(content, segmentStart, fencedRange.start)
      )
    }
    segmentStart = fencedRange.end
  }

  if (segmentStart < content.length) {
    ranges.push(...findInlineCodeRanges(content, segmentStart, content.length))
  }

  return mergeRanges(ranges)
}

function replaceMentionsOutsideMarkdownCode(
  content: string,
  replacement: (match: string, prefix: string, username: string) => string
): string {
  const codeRanges = findMarkdownCodeRanges(content)
  if (codeRanges.length < 1) {
    return content.replace(MENTION_REGEX, replacement)
  }

  let cursor = 0
  let result = ''

  for (const range of codeRanges) {
    if (cursor < range.start) {
      result += content
        .slice(cursor, range.start)
        .replace(MENTION_REGEX, replacement)
    }
    result += content.slice(range.start, range.end)
    cursor = range.end
  }

  if (cursor < content.length) {
    result += content.slice(cursor).replace(MENTION_REGEX, replacement)
  }

  return result
}

export function extractMentionUsernames(content: string): string[] {
  const found = new Set<string>()

  replaceMentionsOutsideMarkdownCode(
    content,
    (_match: string, _prefix: string, username: string): string => {
      found.add(username.toLowerCase())
      return `${_prefix}@${username}`
    }
  )

  return [...found]
}

export function expandMentionsToMarkdownLinks(content: string): string {
  const webBase = normalizedWebBase()

  return replaceMentionsOutsideMarkdownCode(
    content,
    (_match: string, prefix: string, username: string) => {
      return `${prefix}[@${username}](${webBase}/u/${encodeURIComponent(username)})`
    }
  )
}
