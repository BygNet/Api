import { Elysia, t } from 'elysia'
import { BygImage, BygPost, BygShop } from '@/types'
import { BrowseController } from '@/browse/controller'
import { HomePage } from '@/htmlPages'
import { html } from '@elysiajs/html'
import { LikeController } from '@/like/controller'
import { Shops } from '@/shops'
import { CreateController } from '@/create/controller'
import {
  CreatePostSchema,
  UploadImageSchema,
} from '@/schemas'
import { isProd } from '@/data/client'
import { cors } from '@elysiajs/cors'
import { ShareController } from '@/share/controller'
import { AuthController } from '@/auth/controller'
import jwt from 'jsonwebtoken'
import { data } from '@/data/client'
import { sessions } from '@/data/tables'
import { eq } from 'drizzle-orm'
import { swagger } from '@elysiajs/swagger'
import pkgInfo from '../package.json'

const UserSchema = t.Object({
  id: t.Number(),
  email: t.String(),
  username: t.String(),
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

const AnySchema = t.Any()

const AnyArraySchema = t.Array(t.Any())

const HtmlSchema = t.String()

const BygApi = new Elysia().decorate(
  'userId',
  null as number | null
)

BygApi.model({
  User: UserSchema,
  AuthSuccess: AuthSuccessSchema,
  Status: StatusSchema,
  Empty: EmptySchema,
  String: StringSchema,
  Any: AnySchema,
  AnyArray: AnyArraySchema,
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
]

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'

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
  .use(
    cors({
      origin: [
        'http://localhost:5173',
        'https://byg.a35.dev',
      ],
    })
  )
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: pkgInfo.name,
          version: pkgInfo.version,
          description: 'Byg API Docs',
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
            name: 'Create',
            description: 'Content creation endpoints',
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
      const result = await AuthController.signup(body as any, set)
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
      const result = await AuthController.login(body as any, set)
      return result ?? null
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
      response: {
        200: t.Ref('AuthSuccess'),
        400: t.Ref('Empty'),
        401: t.Ref('Empty'),
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
      const result = await AuthController.logout(request, set)
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
  .get(
    '/shops',
    (): BygShop[] => {
      return Shops
    },
    {
      response: {
        200: t.Ref('AnyArray'),
      },
      detail: {
        tags: ['Browse'],
        description: 'List available shops',
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

// Start
if (!isProd) {
  BygApi.listen(5001)
  console.info(
    `Elysia is running at http://${BygApi.server?.hostname}:${BygApi.server?.port}`
  )
} else {
  BygApi.listen(3000)
  console.info('Elysia starting for Prod.')
}

export default BygApi
