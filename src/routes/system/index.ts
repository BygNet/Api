import { t } from 'elysia'

import { HomePage } from '@/htmlPages'
import { type RouteApp } from '../helpers'

export function registerSystemRoutes(app: RouteApp): RouteApp {
  return app
    .get('/ping', () => ({ ok: true }))
    .get('/', (): string => HomePage, {
      response: {
        200: t.Ref('Html'),
      },
      detail: {
        tags: ['Browse'],
        description: 'Return the homepage HTML',
      },
    })
}
