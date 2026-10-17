import { t } from 'elysia'

import { ShortLinksController } from '@/shortLinks/controller'
import { ShortLinkCreateSchema } from '@/schemas'
import { type RouteApp } from '../helpers'

export function registerShortLinkRoutes(app: RouteApp): RouteApp {
  return app
    .post(
      '/short-links',
      async ({ body, set }) => {
        const result = await ShortLinksController.createShortLink(
          (body as { url: string }).url
        )
        if (!result) {
          set.status = 400
          return null
        }
        return result
      },
      {
        body: ShortLinkCreateSchema,
        response: {
          200: t.Ref('ShortLink'),
          400: t.Ref('Empty'),
        },
        detail: {
          tags: ['ShortLinks'],
          description: 'Create a new short link',
        },
      }
    )
    .get(
      '/short-links/:slug',
      async ({ params, set }) => {
        const result = await ShortLinksController.getShortLink(params.slug)
        if (!result) {
          set.status = 404
          return null
        }
        return result
      },
      {
        response: {
          200: t.Ref('ShortLink'),
          404: t.Ref('Empty'),
        },
        detail: {
          tags: ['ShortLinks'],
          description: 'Resolve a short link slug',
        },
      }
    )
}
