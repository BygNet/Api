import { data } from '@/data/client'
import { shortLinks } from '@/data/tables'
import { eq } from 'drizzle-orm'

export interface ShortLinkRecord {
  slug: string
  destinationUrl: string
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('unique') ||
    message.includes('duplicate') ||
    message.includes('constraint failed')
  )
}

export abstract class ShortLinksQueries {
  static async getBySlug(slug: string): Promise<ShortLinkRecord | null> {
    const record = await data.query.shortLinks.findFirst({
      where: eq(shortLinks.slug, slug),
    })

    if (!record) return null
    return {
      slug: record.slug,
      destinationUrl: record.destinationUrl,
    }
  }

  static async insertShortLink(
    slug: string,
    destinationUrl: string
  ): Promise<boolean> {
    try {
      await data.insert(shortLinks).values({
        slug,
        destinationUrl,
      })
      return true
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return false
      }
      throw error
    }
  }
}
