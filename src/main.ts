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

const BygApi = new Elysia().decorate(
  'userId',
  null as number | null
)
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
  // Auth routes
  .post(
    '/auth/signup',
    ({ body, set }) => {
      return AuthController.signup(body as any, set)
    },
    {
      body: t.Object({
        email: t.String(),
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    '/auth/login',
    ({ body, set }) => {
      return AuthController.login(body as any, set)
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post('/auth/logout', async ({ request, set }) => {
    return AuthController.logout(request, set)
  })
  .get('/auth/me', async ({ request, set }) => {
    return AuthController.me(request, set)
  })
  .get('/', (): string => HomePage)
  .get(
    '/latest-posts',
    async (): Promise<BygPost[]> =>
      await BrowseController.browsePosts()
  )
  .get(
    '/latest-images',
    async (): Promise<BygImage[]> =>
      await BrowseController.browseImages()
  )
  .get(
    '/post-details/:id',
    async ({ params }): Promise<BygPost> => {
      return await BrowseController.getPostInfo(
        Number(params.id)
      )
    }
  )
  .get(
    '/image-details/:id',
    async ({ params }): Promise<BygImage> => {
      return await BrowseController.getImageInfo(
        Number(params.id)
      )
    }
  )
  .get('/shops', (): BygShop[] => {
    return Shops
  })
  .post(
    '/like-post/:id',
    async ({ params, set }): Promise<void> => {
      set.status = await LikeController.likePost(
        Number(params.id)
      )
    }
  )
  .post(
    '/like-image/:id',
    async ({ params, set }): Promise<void> => {
      set.status = await LikeController.likeImage(
        Number(params.id)
      )
    }
  )
  .get(
    '/share-post/:id',
    async ({ params }): Promise<string> => {
      return ShareController.sharePost(Number(params.id))
    }
  )
  .get(
    '/share-image/:id',
    async ({ params }): Promise<string> => {
      return ShareController.shareImage(Number(params.id))
    }
  )
  .post(
    '/create-post',
    async ({ body, set, userId }): Promise<void> => {
      if (!userId) {
        set.status = 401
        return
      }

      set.status = await CreateController.createPost(
        body,
        userId
      )
    },
    {
      body: CreatePostSchema,
    }
  )
  .post(
    '/upload-image',
    async ({ body, set, userId }): Promise<void> => {
      if (!userId) {
        set.status = 401
        return
      }

      set.status = await CreateController.uploadImage(
        body,
        userId
      )
    },
    { body: UploadImageSchema }
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
