import { Elysia, type AnyElysia } from 'elysia'
import { html } from '@elysiajs/html'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'

import { data } from '@/data/client'
import { sessions } from '@/data/tables'
import { rssRoutes } from '@/rss/routes'
import { apiModels } from '@/schemas/models'
import { registerRoutes } from '@/routes'
import pkgInfo from '../package'
import { initObservability, logger } from '@/observability/logger'

initObservability({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'byg-api',
  serviceVersion: pkgInfo.version,
  environment: process.env.NODE_ENV ?? 'development',
})

const isLocked: boolean = import.meta.env.LOCKED === 'TRUE'
const writePathPrefixes: string[] = [
  '/create-post',
  '/upload-image',
  '/like-post',
  '/like-image',
  '/like-video',
  '/share-post',
  '/comment-post',
  '/comment-image',
  '/follow-user',
  '/update-profile',
  '/messages/send',
  '/asks',
  '/push/subscribe',
  '/push/unsubscribe',
  '/short-links',
  '/auth/verify-email',
  '/auth/resend-email-verification',
  '/auth/2fa/enable',
  '/auth/2fa/disable',
  '/auth/oauth/',
  '/auth/grants',
  '/auth/exchange',
  '/auth/sessions',
  '/notifications/read-all',
  '/messages/conversations/',
]

const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret'
const requestStartTimes = new WeakMap<Request, number>()

function requestPath(request: Request): string {
  return new URL(request.url).pathname
}

function requestAttributes({
  request,
  status,
  userId,
  durationMs,
}: {
  request: Request
  status?: number | string
  userId?: number | null
  durationMs?: number
}) {
  const headers = request.headers

  return {
    httpMethod: request.method,
    path: requestPath(request),
    statusCode:
      typeof status === 'number' || typeof status === 'string' ? status : 200,
    durationMs,
    userId,
    posthogDistinctId: headers.get('x-posthog-distinct-id'),
    sessionId: headers.get('x-posthog-session-id'),
    userAgent: headers.get('user-agent'),
  }
}

function applyRequestLifecycle(app: AnyElysia): AnyElysia {
  return app
    .onRequest(({ request }) => {
      requestStartTimes.set(request, performance.now())
    })
    .onAfterHandle(({ request, set, userId }) => {
      const startedAt = requestStartTimes.get(request)
      const durationMs =
        startedAt === undefined
          ? undefined
          : Math.round((performance.now() - startedAt) * 100) / 100

      logger.info(
        'http.request.completed',
        requestAttributes({ request, status: set.status, userId, durationMs })
      )
    })
    .onError(({ request, set, error, code, userId }) => {
      const startedAt = requestStartTimes.get(request)
      const durationMs =
        startedAt === undefined
          ? undefined
          : Math.round((performance.now() - startedAt) * 100) / 100

      logger.error('http.request.failed', error, {
        ...requestAttributes({
          request,
          status: set.status,
          userId,
          durationMs,
        }),
        errorCode: code,
      })
    })
    .onBeforeHandle(({ request, set }) => {
      if (!isLocked || request.method !== 'POST') return

      const path = new URL(request.url).pathname
      if (!writePathPrefixes.some(prefix => path.startsWith(prefix))) return

      logger.warn('http.write_locked', {
        httpMethod: request.method,
        path,
      })
      set.status = 503
      return 'Writes are temporarily disabled'
    })
}

function applyAuthentication(app: AnyElysia): AnyElysia {
  return app
    .decorate('userId', null as number | null)
    .derive(async ({ request }): Promise<{ userId: number | null }> => {
      const auth = request.headers.get('authorization')
      if (!auth) return { userId: null }

      try {
        const token = auth.replace('Bearer ', '')
        const payload = jwt.verify(token, jwtSecret) as any

        const session = await data.query.sessions.findFirst({
          where: eq(sessions.id, payload.sid),
        })

        if (
          !session ||
          (session.expiresAt !== null &&
            session.expiresAt.getTime() < Date.now())
        ) {
          return { userId: null }
        }

        void data
          .update(sessions)
          .set({ lastUsedAt: new Date() })
          .where(eq(sessions.id, payload.sid))

        return { userId: Number(payload.sub) }
      } catch {
        return { userId: null }
      }
    })
}

export function createApp() {
  let app: AnyElysia = new Elysia().model(apiModels)
  app = applyRequestLifecycle(app)
  app = applyAuthentication(app)

  app = app
    .use(html())
    .use(rssRoutes)
    .use(
      cors({
        origin: [
          'http://localhost:2257',
          'http://localhost:2258',
          'http://localhost:2253',
          'https://byg.gg',
          'https://share.byg.gg',
          'https://asks.byg.gg',
          'https://byg.a35.dev',
        ],
        credentials: true,
      })
    )
    .use(
      swagger({
        path: '/swagger',
        documentation: {
          info: {
            title: pkgInfo.name,
            version: pkgInfo.version!,
            description: pkgInfo.description,
          },
          tags: [
            { name: 'Auth', description: 'Authentication & sessions' },
            { name: 'Browse', description: 'Public content browsing' },
            { name: 'Interact', description: 'Likes & interactions' },
            { name: 'Share', description: 'Shareable links' },
            {
              name: 'ShortLinks',
              description: 'Short link creation and lookup',
            },
            { name: 'Create', description: 'Content creation endpoints' },
            {
              name: 'Asks',
              description: 'Anonymous ask submission and inbox',
            },
            {
              name: 'Notifications',
              description: 'User notifications feed',
            },
            {
              name: 'Messages',
              description: 'Direct messaging and live events',
            },
            {
              name: 'Search',
              description: 'Web search via Byg Search proxy',
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      })
    )

  return registerRoutes(app)
}
