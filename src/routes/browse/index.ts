import { t } from 'elysia'

import { BrowseController } from '@/browse/controller'
import { ProfileController } from '@/profile/controller'
import type { BygImage, BygPost } from '@/types'
import { type RouteApp } from '../helpers'

export function registerBrowseRoutes(app: RouteApp): RouteApp {
  return app
    .get(
      '/latest-posts',
      async (): Promise<BygPost[]> => await BrowseController.browsePosts(),
      {
        response: {
          200: t.Ref('AnyArray'),
        },
        detail: {
          tags: ['Browse'],
          description: 'Fetch the latest posts',
        },
      }
    )
    .get(
      '/latest-images',
      async (): Promise<BygImage[]> => await BrowseController.browseImages(),
      {
        response: {
          200: t.Ref('AnyArray'),
        },
        detail: {
          tags: ['Browse'],
          description: 'Fetch the latest images',
        },
      }
    )
    .get(
      '/posts/:username',
      async ({ params }): Promise<BygPost[]> =>
        await BrowseController.getPostsByUsername(params.username),
      {
        response: {
          200: t.Ref('AnyArray'),
        },
        detail: {
          tags: ['Browse'],
          description: 'Fetch posts by username',
        },
      }
    )
    .get(
      '/images/:username',
      async ({ params }): Promise<BygImage[]> =>
        await BrowseController.getImagesByUsername(params.username),
      {
        response: {
          200: t.Ref('AnyArray'),
        },
        detail: {
          tags: ['Browse'],
          description: 'Fetch images by username',
        },
      }
    )
    .get(
      '/user-suggestions',
      async ({ query }) => {
        const rawQuery = query.q?.trim() ?? ''
        if (!rawQuery) return []

        const rawLimit = Number(query.limit ?? '8')
        const limit = Number.isFinite(rawLimit) ? rawLimit : 8

        return await ProfileController.getUserSuggestions(rawQuery, limit)
      },
      {
        query: t.Object({
          q: t.String(),
          limit: t.Optional(t.String()),
        }),
        response: {
          200: t.Ref('AnyArray'),
        },
        detail: {
          tags: ['Browse'],
          description:
            'Suggest accounts by username prefix for @mention composer support',
        },
      }
    )
    .get(
      '/post-details/:id',
      async ({ params }): Promise<BygPost> =>
        await BrowseController.getPostInfo(Number(params.id)),
      {
        response: {
          200: t.Ref('Any'),
        },
        detail: {
          tags: ['Browse'],
          description: 'Get detailed information for a single post',
        },
      }
    )
    .get(
      '/image-details/:id',
      async ({ params }): Promise<BygImage> =>
        await BrowseController.getImageInfo(Number(params.id)),
      {
        response: {
          200: t.Ref('Any'),
        },
        detail: {
          tags: ['Browse'],
          description: 'Get detailed information for a single image',
        },
      }
    )
}
