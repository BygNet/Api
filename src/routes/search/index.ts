import { t } from 'elysia'

import { SearchController, SearchProxyError } from '@/search/controller'
import { HeadController, HeadFetchError } from '@/head/controller'
import { SongLinkController, SongLinkFetchError } from '@/songLink/controller'
import type { BygSearchResponse, BygSongLinkInfo } from '@/types'
import { logger } from '@/observability/logger'
import { type RouteApp } from '../helpers'

export function registerSearchRoutes(app: RouteApp): RouteApp {
  return app
    .get(
      '/search',
      async ({ query, set }): Promise<BygSearchResponse | null> => {
        const searchQuery = query.q.trim()
        if (!searchQuery) {
          set.status = 400
          return null
        }

        const category = SearchController.normalizeCategory(query.category)
        const page = SearchController.normalizePage(query.page)
        const safeSearch = SearchController.normalizeSafeSearch(
          query.safeSearch
        )
        const timeRange = SearchController.normalizeTimeRange(query.timeRange)
        const language = query.language?.trim()

        try {
          return await SearchController.search({
            query: searchQuery,
            category,
            page,
            language: language && language.length > 0 ? language : undefined,
            safeSearch,
            timeRange,
          })
        } catch (error: unknown) {
          if (error instanceof SearchProxyError) {
            logger.warn('search.request_rejected', {
              reason: error.message,
              statusCode: error.statusCode,
              query: searchQuery,
              category,
              page,
            })
            set.status = error.statusCode
            return null
          }

          logger.error('search.request_failed', error, {
            query: searchQuery,
            category,
            page,
          })
          set.status = 502
          return null
        }
      },
      {
        query: t.Object({
          q: t.String(),
          category: t.Optional(t.String()),
          page: t.Optional(t.String()),
          language: t.Optional(t.String()),
          safeSearch: t.Optional(t.String()),
          timeRange: t.Optional(t.String()),
        }),
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          502: t.Ref('Empty'),
          503: t.Ref('Empty'),
        },
        detail: {
          tags: ['Search'],
          description:
            'Search the web, images, videos, music and more through Byg Search (SearXNG proxy)',
        },
      }
    )
    .get(
      '/head-tags',
      async ({ query, set }) => {
        try {
          return await HeadController.getHeadTags(query.url)
        } catch (error: unknown) {
          if (error instanceof HeadFetchError) {
            logger.warn('head_tags.request_rejected', {
              reason: error.message,
              statusCode: error.statusCode,
              url: query.url,
            })
            set.status = error.statusCode
            return null
          }

          logger.error('head_tags.request_failed', error, {
            url: query.url,
          })
          set.status = 502
          return null
        }
      },
      {
        query: t.Object({ url: t.String() }),
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          415: t.Ref('Empty'),
          422: t.Ref('Empty'),
          502: t.Ref('Empty'),
          504: t.Ref('Empty'),
        },
        detail: {
          tags: ['Search'],
          description:
            'Fetch a webpage and return structured metadata extracted from its head tags',
        },
      }
    )
    .get(
      '/song-link-info',
      async ({ query, set }): Promise<BygSongLinkInfo | null> => {
        try {
          return await SongLinkController.getSongLinkInfo(query.url)
        } catch (error: unknown) {
          if (error instanceof SongLinkFetchError) {
            logger.warn('song_link.request_rejected', {
              reason: error.message,
              statusCode: error.statusCode,
              url: query.url,
            })
            set.status = error.statusCode
            return null
          }

          logger.error('song_link.request_failed', error, {
            url: query.url,
          })
          set.status = 502
          return null
        }
      },
      {
        query: t.Object({ url: t.String() }),
        response: {
          200: t.Ref('SongLinkInfo'),
          400: t.Ref('Empty'),
          415: t.Ref('Empty'),
          422: t.Ref('Empty'),
          502: t.Ref('Empty'),
          504: t.Ref('Empty'),
        },
        detail: {
          tags: ['Search'],
          description:
            'Fetch and extract song details and platform links from a song.link/Odesli page',
        },
      }
    )
}
