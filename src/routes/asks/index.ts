import { t } from 'elysia'

import { AsksController } from '@/asks/controller'
import { AskCreateSchema } from '@/schemas'
import { parseLimit, requireUser, type RouteApp } from '../helpers'

export function registerAskRoutes(app: RouteApp): RouteApp {
  return app
    .get(
      '/asks',
      async ({ userId, query, set }) => {
        if (!requireUser(userId, set)) return null
        return await AsksController.getAsks(userId, parseLimit(query.limit, 40))
      },
      {
        query: t.Object({ limit: t.Optional(t.String()) }),
        response: {
          200: t.Ref('AskArray'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Asks'],
          description: 'Get recent asks for the authenticated user',
        },
      }
    )
    .post(
      '/asks/:username',
      async ({ body, params, set }) => {
        const result = await AsksController.submitAsk(
          params.username,
          body.content,
          body.variantId
        )

        if (!result.ok) {
          switch (result.code) {
            case 'empty_ask':
              set.status = 400
              return null
            case 'recipient_not_found':
              set.status = 404
              return null
          }
        }

        return { status: 'ok' }
      },
      {
        body: AskCreateSchema,
        response: {
          200: t.Ref('Status'),
          400: t.Ref('Empty'),
          404: t.Ref('Empty'),
        },
        detail: {
          tags: ['Asks'],
          description: 'Submit an anonymous ask for a user by username',
        },
      }
    )
}
