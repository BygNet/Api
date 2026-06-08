import { Elysia, t } from 'elysia'
import {
  BygImage,
  BygPost,
  BygSearchResponse,
  BygSongLinkInfo,
} from '@/types'
import { BrowseController } from '@/browse/controller'
import { HomePage } from '@/htmlPages'
import { html } from '@elysiajs/html'
import { LikeController } from '@/like/controller'
import { CreateController } from '@/create/controller'
import {
  AskCreateSchema,
  CommentSchema,
  MessageSendBody,
  CreatePostSchema,
  EnableTwoFactorSchema,
  MessageConversationInfoSchema,
  MessageConversationInviteSchema,
  MessageDirectConversationSchema,
  MessageGroupConversationSchema,
  MessageSendSchema,
  PushSubscriptionBody,
  PushSubscriptionSchema,
  PushUnsubscribeBody,
  PushUnsubscribeSchema,
  ShortLinkCreateSchema,
  UpdateProfileSchema,
  UploadImageSchema,
  VerifyEmailSchema,
} from '@/schemas'
import { isProd } from '@/data/client'
import { cors } from '@elysiajs/cors'
import { ShareController } from '@/share/controller'
import { AuthController } from '@/auth/controller'
import { CommentsController } from '@/comments/controller'
import { AsksController } from '@/asks/controller'
import { ProfileController } from '@/profile/controller'
import { NotificationsController } from '@/notifications/controller'
import { PushService } from '@/push/service'
import { MessagesController } from '@/messages/controller'
import { MessagesRealtimeService } from '@/messages/realtime'
import {
  SearchController,
  SearchProxyError,
} from '@/search/controller'
import { ShortLinksController } from '@/shortLinks/controller'
import {
  HeadController,
  HeadFetchError,
} from '@/head/controller'
import {
  SongLinkController,
  SongLinkFetchError,
} from '@/songLink/controller'
import jwt from 'jsonwebtoken'
import { data } from '@/data/client'
import { sessions } from '@/data/tables'
import { eq } from 'drizzle-orm'
import { swagger } from '@elysiajs/swagger'
import { rssRoutes } from '@/rss/routes'
import pkgInfo from '../package'
import {
  initObservability,
  logger,
  shutdownObservability,
} from '@/observability/logger'

initObservability({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'byg-api',
  serviceVersion: pkgInfo.version,
  environment: process.env.NODE_ENV ?? 'development',
})

const UserSchema = t.Object({
  id: t.Number(),
  email: t.String(),
  username: t.String(),
  displayName: t.Union([t.String(), t.Null()]),
  pronouns: t.Union([t.String(), t.Null()]),
  songLinkUrl: t.Union([t.String(), t.Null()]),
  avatarUrl: t.Union([t.String(), t.Null()]),
  bannerUrl: t.Union([t.String(), t.Null()]),
  bio: t.Union([t.String(), t.Null()]),
  subscriptionState: t.Union([t.String(), t.Null()]),
  emailVerificationCode: t.Union([t.String(), t.Null()]),
  twoFactorEnabled: t.Boolean(),
})

const StatusSchema = t.Object({
  status: t.String(),
})

const StringSchema = t.String()

const EmptySchema = t.Null()

const AuthSuccessSchema = t.Object({
  token: t.String(),
  user: UserSchema,
})

const TwoFactorChallengeSchema = t.Object({
  requiresTwoFactor: t.Literal(true),
})

const TwoFactorSetupSchema = t.Object({
  secret: t.String(),
  manualEntryKey: t.String(),
  otpauthUrl: t.String(),
})

const PushPublicKeySchema = t.Object({
  publicKey: t.String(),
})

const ShortLinkSchema = t.Object({
  slug: t.String(),
  url: t.String(),
})

const AskSchema = t.Object({
  id: t.Number(),
  content: t.String(),
  createdDate: t.String(),
})

const AskArraySchema = t.Array(AskSchema)

const SongLinkInfoSchema = t.Object({
  requestedUrl: t.String(),
  finalUrl: t.String(),
  pageUrl: t.Union([t.String(), t.Null()]),
  pageId: t.Union([t.String(), t.Null()]),
  entityUniqueId: t.Union([t.String(), t.Null()]),
  title: t.Union([t.String(), t.Null()]),
  artistName: t.Union([t.String(), t.Null()]),
  thumbnailUrl: t.Union([t.String(), t.Null()]),
  links: t.Array(
    t.Object({
      platform: t.String(),
      displayName: t.String(),
      url: t.String(),
    })
  ),
})

const AnySchema = t.Any()

const AnyArraySchema = t.Array(t.Any())

const CommentArraySchema = t.Array(
  t.Object({
    id: t.Number(),
    author: t.String(),
    content: t.String(),
    createdDate: t.String(),
  })
)

const HtmlSchema = t.String()

const BygApi = new Elysia().decorate(
  'userId',
  null as number | null
)

BygApi.model({
  User: UserSchema,
  AuthSuccess: AuthSuccessSchema,
  TwoFactorChallenge: TwoFactorChallengeSchema,
  TwoFactorSetup: TwoFactorSetupSchema,
  PushPublicKey: PushPublicKeySchema,
  ShortLink: ShortLinkSchema,
  Ask: AskSchema,
  AskArray: AskArraySchema,
  SongLinkInfo: SongLinkInfoSchema,
  Status: StatusSchema,
  Empty: EmptySchema,
  String: StringSchema,
  Any: AnySchema,
  AnyArray: AnyArraySchema,
  CommentArray: CommentArraySchema,
  Html: HtmlSchema,
})

const IsLocked: boolean = import.meta.env.LOCKED === 'TRUE'
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
]

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
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
      typeof status === 'number' ||
      typeof status === 'string'
        ? status
        : 200,
    durationMs,
    userId,
    posthogDistinctId: headers.get('x-posthog-distinct-id'),
    sessionId: headers.get('x-posthog-session-id'),
    userAgent: headers.get('user-agent'),
  }
}

BygApi.onRequest(({ request }) => {
  requestStartTimes.set(request, performance.now())
})

BygApi.onAfterHandle(({ request, set, userId }) => {
  const startedAt = requestStartTimes.get(request)
  const durationMs =
    startedAt === undefined
      ? undefined
      : Math.round((performance.now() - startedAt) * 100) /
        100

  logger.info(
    'http.request.completed',
    requestAttributes({
      request,
      status: set.status,
      userId,
      durationMs,
    })
  )
})

BygApi.onError(({ request, set, error, code, userId }) => {
  const startedAt = requestStartTimes.get(request)
  const durationMs =
    startedAt === undefined
      ? undefined
      : Math.round((performance.now() - startedAt) * 100) /
        100

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

BygApi.onBeforeHandle(({ request, set }) => {
  if (!IsLocked) return
  if (request.method !== 'POST') return

  const url = new URL(request.url)
  const path: string = url.pathname

  if (
    writePathPrefixes.some(prefix =>
      path.startsWith(prefix)
    )
  ) {
    logger.warn('http.write_locked', {
      httpMethod: request.method,
      path,
    })
    set.status = 503
    return 'Writes are temporarily disabled'
  }
})

BygApi.derive(
  async ({
    request,
  }): Promise<{ userId: number | null }> => {
    const auth = request.headers.get('authorization')
    if (!auth) return { userId: null }

    try {
      const token: string = auth.replace('Bearer ', '')
      const payload = jwt.verify(token, JWT_SECRET) as any

      const session = await data.query.sessions.findFirst({
        where: eq(sessions.id, payload.sid),
      })

      if (
        !session ||
        session.expiresAt.getTime() < Date.now()
      ) {
        return { userId: null }
      }

      return { userId: Number(payload.sub) }
    } catch {
      return { userId: null }
    }
  }
)

// Routes
BygApi.use(html())
  .use(rssRoutes)
  .use(
    cors({
      origin: [
        'http://localhost:2257', // Byg dev
        'http://localhost:2258', // Byg Share dev
        'http://localhost:2253', // Byg Asks dev
        'https://byg.gg', // Byg
        'https://share.byg.gg', // Byg Share
        'https://asks.byg.gg', // Byg Asks
        'https://byg.a35.dev', // Legacy Byg
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
          {
            name: 'Auth',
            description: 'Authentication & sessions',
          },
          {
            name: 'Browse',
            description: 'Public content browsing',
          },
          {
            name: 'Interact',
            description: 'Likes & interactions',
          },
          { name: 'Share', description: 'Shareable links' },
          {
            name: 'ShortLinks',
            description: 'Short link creation and lookup',
          },
          {
            name: 'Create',
            description: 'Content creation endpoints',
          },
          {
            name: 'Asks',
            description:
              'Anonymous ask submission and inbox',
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
  // Auth routes
  .post(
    '/auth/signup',
    async ({ body, set }) => {
      const result = await AuthController.signup(
        body as any,
        set
      )
      return result ?? null
    },
    {
      body: t.Object({
        email: t.String(),
        username: t.String(),
        password: t.String(),
      }),
      response: {
        200: t.Ref('AuthSuccess'),
        400: t.Ref('Empty'),
        409: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description: 'Create a new user account',
      },
    }
  )
  .post(
    '/auth/login',
    async ({ body, set }) => {
      const result = await AuthController.login(
        body as any,
        set
      )
      return result ?? null
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        twoFactorCode: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('AuthSuccess'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('TwoFactorChallenge'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Authenticate a user and return a session token',
      },
    }
  )
  .post(
    '/auth/logout',
    async ({ request, set }) => {
      const result = await AuthController.logout(
        request,
        set
      )
      return result ?? null
    },
    {
      response: {
        200: t.Ref('Status'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description: 'Invalidate the current user session',
      },
    }
  )
  .get(
    '/auth/me',
    async ({ request, set }) => {
      const result = await AuthController.me(request, set)
      return result ?? null
    },
    {
      response: {
        200: t.Ref('User'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description: 'Get the currently authenticated user',
      },
    }
  )
  .post(
    '/auth/verify-email',
    async ({ body, set, userId }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await AuthController.verifyEmail(
        userId,
        body.code
      )

      return null
    },
    {
      body: VerifyEmailSchema,
      response: {
        204: t.Ref('Empty'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Verify the current user email address',
      },
    }
  )
  .post(
    '/auth/resend-email-verification',
    async ({ set, userId }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status =
        await AuthController.resendEmailVerification(userId)

      return null
    },
    {
      response: {
        204: t.Ref('Empty'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Resend the current user email verification code',
      },
    }
  )
  .get(
    '/auth/2fa/setup',
    async ({ set, userId }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const result =
        await AuthController.createTwoFactorSetup(userId)

      if (!result) {
        set.status = 404
        return null
      }

      return result
    },
    {
      response: {
        200: t.Ref('TwoFactorSetup'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Generate a new authenticator app secret for the current user',
      },
    }
  )
  .post(
    '/auth/2fa/enable',
    async ({ body, set, userId }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const result = await AuthController.enableTwoFactor(
        userId,
        body.secret,
        body.code
      )

      if (!result) {
        set.status = 400
        return null
      }

      return result
    },
    {
      body: EnableTwoFactorSchema,
      response: {
        200: t.Ref('User'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Enable authenticator app 2FA for the current user',
      },
    }
  )
  .post(
    '/auth/2fa/disable',
    async ({ set, userId }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const result =
        await AuthController.disableTwoFactor(userId)

      if (!result) {
        set.status = 404
        return null
      }

      return result
    },
    {
      response: {
        200: t.Ref('User'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Disable authenticator app 2FA for the current user',
      },
    }
  )
  .post(
    '/hash',
    async ({ body }): Promise<string> => {
      return AuthController.hash(body.password)
    },
    {
      body: t.Object({
        password: t.String(),
      }),
      response: {
        200: t.Ref('String'),
      },
      detail: {
        tags: ['Auth'],
        description: 'Generate a password hash',
      },
    }
  )
  // Browse
  .get('/', (): string => HomePage, {
    response: {
      200: t.Ref('Html'),
    },
    detail: {
      tags: ['Browse'],
      description: 'Return the homepage HTML',
    },
  })
  .get(
    '/latest-posts',
    async (): Promise<BygPost[]> =>
      await BrowseController.browsePosts(),
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
    async (): Promise<BygImage[]> =>
      await BrowseController.browseImages(),
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
      await BrowseController.getPostsByUsername(
        params.username
      ),
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
      await BrowseController.getImagesByUsername(
        params.username
      ),
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
      if (!rawQuery) {
        return []
      }

      const rawLimit = Number(query.limit ?? '8')
      const limit = Number.isFinite(rawLimit) ? rawLimit : 8

      return await ProfileController.getUserSuggestions(
        rawQuery,
        limit
      )
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
    '/search',
    async ({
      query,
      set,
    }): Promise<BygSearchResponse | null> => {
      const searchQuery = query.q.trim()
      if (!searchQuery) {
        set.status = 400
        return null
      }

      const category = SearchController.normalizeCategory(
        query.category
      )
      const page = SearchController.normalizePage(
        query.page
      )
      const safeSearch =
        SearchController.normalizeSafeSearch(
          query.safeSearch
        )
      const timeRange = SearchController.normalizeTimeRange(
        query.timeRange
      )
      const language = query.language?.trim()

      try {
        return await SearchController.search({
          query: searchQuery,
          category,
          page,
          language:
            language && language.length > 0
              ? language
              : undefined,
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
      query: t.Object({
        url: t.String(),
      }),
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
    async ({
      query,
      set,
    }): Promise<BygSongLinkInfo | null> => {
      try {
        return await SongLinkController.getSongLinkInfo(
          query.url
        )
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
      query: t.Object({
        url: t.String(),
      }),
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
  .get(
    '/post-details/:id',
    async ({ params }): Promise<BygPost> => {
      return await BrowseController.getPostInfo(
        Number(params.id)
      )
    },
    {
      response: {
        200: t.Ref('Any'),
      },
      detail: {
        tags: ['Browse'],
        description:
          'Get detailed information for a single post',
      },
    }
  )
  .get(
    '/image-details/:id',
    async ({ params }): Promise<BygImage> => {
      return await BrowseController.getImageInfo(
        Number(params.id)
      )
    },
    {
      response: {
        200: t.Ref('Any'),
      },
      detail: {
        tags: ['Browse'],
        description:
          'Get detailed information for a single image',
      },
    }
  )
  // Interact
  .post(
    '/like-post/:id',
    async ({ params, set }): Promise<null> => {
      set.status = await LikeController.likePost(
        Number(params.id)
      )
      return null
    },
    {
      response: {
        200: t.Ref('Empty'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Like or unlike a post',
      },
    }
  )
  .post(
    '/like-image/:id',
    async ({ params, set }): Promise<null> => {
      set.status = await LikeController.likeImage(
        Number(params.id)
      )
      return null
    },
    {
      response: {
        200: t.Ref('Empty'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Like or unlike an image',
      },
    }
  )
  // Share
  .get(
    '/share-post/:id',
    async ({ params }): Promise<string> => {
      return ShareController.sharePost(Number(params.id))
    },
    {
      response: {
        200: t.Ref('String'),
      },
      detail: {
        tags: ['Share'],
        description: 'Generate a shareable link for a post',
      },
    }
  )
  .get(
    '/share-image/:id',
    async ({ params }): Promise<string> => {
      return ShareController.shareImage(Number(params.id))
    },
    {
      response: {
        200: t.Ref('String'),
      },
      detail: {
        tags: ['Share'],
        description:
          'Generate a shareable link for an image',
      },
    }
  )
  // Short Links
  .post(
    '/short-links',
    async ({ body, set }) => {
      const result =
        await ShortLinksController.createShortLink(
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
      const result =
        await ShortLinksController.getShortLink(params.slug)
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
  // Create
  .post(
    '/create-post',
    async ({ body, set, userId }): Promise<null> => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await CreateController.createPost(
        body,
        userId
      )
      return null
    },
    {
      body: CreatePostSchema,
      response: {
        200: t.Ref('Empty'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Create'],
        description: 'Create a new post',
      },
    }
  )
  .post(
    '/upload-image',
    async ({ body, set, userId }): Promise<null> => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await CreateController.uploadImage(
        body,
        userId
      )
      return null
    },
    {
      body: UploadImageSchema,
      response: {
        200: t.Ref('Empty'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Create'],
        description: 'Upload a new image',
      },
    }
  )
  // Comments
  .get(
    '/post-comments/:id',
    async ({ params }) => {
      return await CommentsController.getPostComments(
        Number(params.id)
      )
    },
    {
      response: {
        200: t.Ref('CommentArray'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Get comments for a post',
      },
    }
  )
  .post(
    '/comment-post',
    async ({ body, set, userId }): Promise<null> => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await CommentsController.commentPost(
        body as any,
        userId
      )
      return null
    },
    {
      body: CommentSchema,
      response: {
        200: t.Ref('Empty'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Add a comment to a post',
      },
    }
  )
  .get(
    '/image-comments/:id',
    async ({ params }) => {
      return await CommentsController.getImageComments(
        Number(params.id)
      )
    },
    {
      response: {
        200: t.Ref('CommentArray'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Get comments for an image',
      },
    }
  )
  .post(
    '/comment-image',
    async ({ body, set, userId }): Promise<null> => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await CommentsController.commentImage(
        body as any,
        userId
      )
      return null
    },
    {
      body: CommentSchema,
      response: {
        200: t.Ref('Empty'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Add a comment to an image',
      },
    }
  )
  // Push
  .get(
    '/push/public-key',
    () => {
      return {
        publicKey: PushService.getPublicKey(),
      }
    },
    {
      response: {
        200: t.Ref('PushPublicKey'),
      },
      detail: {
        tags: ['Notifications'],
        description: 'Get web push VAPID public key',
      },
    }
  )
  .post(
    '/push/subscribe',
    async ({ body, userId, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      PushService.registerSubscription(
        userId,
        body as PushSubscriptionBody
      )
      return { status: 'ok' }
    },
    {
      body: PushSubscriptionSchema,
      response: {
        200: t.Ref('Status'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Notifications'],
        description:
          'Register a web push subscription for the authenticated user',
      },
    }
  )
  .post(
    '/push/unsubscribe',
    async ({ body, userId, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      PushService.unregisterSubscription(
        userId,
        (body as PushUnsubscribeBody).endpoint
      )
      return { status: 'ok' }
    },
    {
      body: PushUnsubscribeSchema,
      response: {
        200: t.Ref('Status'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Notifications'],
        description:
          'Remove a web push subscription for the authenticated user',
      },
    }
  )
  // Notifications
  .get(
    '/notifications',
    async ({ userId, query, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const rawLimit = Number(query.limit ?? '40')
      const limit = Number.isFinite(rawLimit)
        ? rawLimit
        : 40

      return await NotificationsController.getNotifications(
        userId,
        limit
      )
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('AnyArray'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Notifications'],
        description:
          'Get recent notifications for the authenticated user',
      },
    }
  )
  .get(
    '/asks',
    async ({ userId, query, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const rawLimit = Number(query.limit ?? '40')
      const limit = Number.isFinite(rawLimit)
        ? rawLimit
        : 40

      return await AsksController.getAsks(userId, limit)
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('AskArray'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Asks'],
        description:
          'Get recent asks for the authenticated user',
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
        description:
          'Submit an anonymous ask for a user by username',
      },
    }
  )
  // Messages
  .get(
    '/messages/threads',
    async ({ userId, query, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const rawLimit = Number(query.limit ?? '24')
      const limit = Number.isFinite(rawLimit)
        ? rawLimit
        : 24

      return await MessagesController.getThreads(
        userId,
        limit
      )
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('AnyArray'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Get recent message threads for the authenticated user',
      },
    }
  )
  .get(
    '/messages/conversations/:conversationId',
    async ({ userId, params, query, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const conversationId = Number(params.conversationId)
      if (!Number.isFinite(conversationId)) {
        set.status = 400
        return null
      }

      const rawLimit = Number(query.limit ?? '120')
      const limit = Number.isFinite(rawLimit)
        ? rawLimit
        : 120
      const conversation =
        await MessagesController.getConversation(
          userId,
          conversationId,
          limit
        )

      if (!conversation) {
        set.status = 404
        return null
      }

      return conversation
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Get conversation messages by conversation id',
      },
    }
  )
  .get(
    '/messages/conversation/:username',
    async ({ userId, params, query, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const rawLimit = Number(query.limit ?? '120')
      const limit = Number.isFinite(rawLimit)
        ? rawLimit
        : 120
      const conversation =
        await MessagesController.getConversationByUsername(
          userId,
          params.username,
          limit
        )

      if (!conversation) {
        set.status = 404
        return null
      }

      return conversation
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('Any'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Get or preview a direct conversation with another user by username',
      },
    }
  )
  .post(
    '/messages/conversations/direct',
    async ({ body, userId, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      return await MessagesController.getOrCreateDirectConversation(
        body,
        userId,
        set
      )
    },
    {
      body: MessageDirectConversationSchema,
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Get or create a direct message conversation',
      },
    }
  )
  .post(
    '/messages/conversations/group',
    async ({ body, userId, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      return await MessagesController.createGroupConversation(
        body,
        userId,
        set
      )
    },
    {
      body: MessageGroupConversationSchema,
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description: 'Create a group conversation',
      },
    }
  )
  .post(
    '/messages/conversations/:conversationId/members',
    async ({ body, userId, params, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const conversationId = Number(params.conversationId)
      if (!Number.isFinite(conversationId)) {
        set.status = 400
        return null
      }

      return await MessagesController.inviteGroupMember(
        conversationId,
        body,
        userId,
        set
      )
    },
    {
      body: MessageConversationInviteSchema,
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Invite a member to a group conversation as the creator',
      },
    }
  )
  .delete(
    '/messages/conversations/:conversationId/members/:memberUserId',
    async ({ userId, params, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const conversationId = Number(params.conversationId)
      const memberUserId = Number(params.memberUserId)
      if (
        !Number.isFinite(conversationId) ||
        !Number.isFinite(memberUserId)
      ) {
        set.status = 400
        return null
      }

      return await MessagesController.removeGroupMember(
        conversationId,
        memberUserId,
        userId,
        set
      )
    },
    {
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Remove a member from a group conversation as the creator',
      },
    }
  )
  .patch(
    '/messages/conversations/:conversationId',
    async ({ body, userId, params, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const conversationId = Number(params.conversationId)
      if (!Number.isFinite(conversationId)) {
        set.status = 400
        return null
      }

      return await MessagesController.updateGroupInfo(
        conversationId,
        body,
        userId,
        set
      )
    },
    {
      body: MessageConversationInfoSchema,
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Update group conversation name and title as the creator',
      },
    }
  )
  .get(
    '/messages/share-targets',
    async ({ userId, query, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const rawLimit = Number(query.limit ?? '24')
      const limit = Number.isFinite(rawLimit)
        ? rawLimit
        : 24

      return await MessagesController.getShareTargets(
        userId,
        limit
      )
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Ref('AnyArray'),
        401: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Get recently contacted and followed users for sharing',
      },
    }
  )
  .post(
    '/messages/send',
    async ({ body, userId, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }

      const message = await MessagesController.sendMessage(
        body as MessageSendBody,
        userId,
        set
      )
      return message ?? null
    },
    {
      body: MessageSendSchema,
      response: {
        200: t.Ref('Any'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        403: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Messages'],
        description:
          'Send a message to a conversation or direct recipient',
      },
    }
  )
  .ws('/messages/live', {
    open(ws) {
      MessagesRealtimeService.handleOpen(ws)
    },
    async message(ws, message) {
      await MessagesRealtimeService.handleMessage(
        ws,
        message
      )
    },
    close(ws) {
      MessagesRealtimeService.handleClose(ws)
    },
  })
  // Profile
  .get(
    '/profile/:username',
    async ({ params, userId }) => {
      return await ProfileController.getProfileByUsername(
        params.username,
        userId ?? undefined
      )
    },
    {
      response: {
        200: t.Ref('Any'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Browse'],
        description: 'Get a user profile by username',
      },
    }
  )
  .get(
    '/profile-me',
    async ({ userId, set }) => {
      if (!userId) {
        set.status = 401
        return null
      }
      return await ProfileController.getProfile(userId)
    },
    {
      response: {
        200: t.Ref('Any'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description:
          'Get the current authenticated user profile',
      },
    }
  )
  .post(
    '/follow-user/:id',
    async ({ params, set, userId }): Promise<null> => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await ProfileController.followUser(
        userId,
        Number(params.id)
      )
      return null
    },
    {
      response: {
        204: t.Ref('Empty'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
      },
      detail: {
        tags: ['Interact'],
        description: 'Follow or unfollow a user',
      },
    }
  )
  .post(
    '/update-profile',
    async ({ body, set, userId }): Promise<null> => {
      if (!userId) {
        set.status = 401
        return null
      }

      set.status = await ProfileController.updateProfile(
        userId,
        body as any
      )
      return null
    },
    {
      body: UpdateProfileSchema,
      response: {
        400: t.Ref('Empty'),
        204: t.Ref('Empty'),
        403: t.Ref('Empty'),
        401: t.Ref('Empty'),
        404: t.Ref('Empty'),
        500: t.Ref('Empty'),
      },
      detail: {
        tags: ['Auth'],
        description: 'Update the current user profile',
      },
    }
  )

// Start
if (!isProd) {
  BygApi.listen(2255)
  logger.info('server.started', {
    environment: 'development',
    hostname: BygApi.server?.hostname,
    port: BygApi.server?.port,
  })
} else {
  BygApi.listen(3000)
  logger.info('server.started', {
    environment: 'production',
    hostname: BygApi.server?.hostname,
    port: BygApi.server?.port,
  })
}

process.on('SIGTERM', async () => {
  logger.info('server.shutdown_requested', {
    signal: 'SIGTERM',
  })
  await shutdownObservability()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('server.shutdown_requested', {
    signal: 'SIGINT',
  })
  await shutdownObservability()
  process.exit(0)
})
