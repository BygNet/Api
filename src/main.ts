import { Elysia } from 'elysia'
import {
  BygImage,
  BygPost,
  BygShop,
  BygVideo,
} from '@/types'
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

const bygApi = new Elysia()

// Routes
bygApi
  .use(html())
  .use(
    cors({
      origin: [
        'http://localhost:5173',
        'https://byg.a35.dev',
      ],
    })
  )
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
    '/latest-videos',
    async (): Promise<BygVideo[]> =>
      await BrowseController.browseVideos()
  )
  .get(
    '/post-details/:id',
    async ({ params }): Promise<BygPost> => {
      return await BrowseController.getPostInfo(
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
  .post(
    '/like-video/:id',
    async ({ params, set }): Promise<void> => {
      set.status = await LikeController.likeVideo(
        Number(params.id)
      )
    }
  )
  .post(
    '/create-post',
    async ({ body, set }): Promise<void> => {
      set.status = await CreateController.createPost(body)
    },
    {
      body: CreatePostSchema,
    }
  )
  .post(
    '/upload-image',
    async ({ body, set }): Promise<void> => {
      set.status = await CreateController.uploadImage(body)
    },
    { body: UploadImageSchema }
  )

// Start
if (!isProd) {
  bygApi.listen(5001)
  console.info(
    `Elysia is running at http://${bygApi.server?.hostname}:${bygApi.server?.port}`
  )
} else {
  bygApi.listen(3000)
  console.info('Elysia starting for Prod.')
}

export default bygApi
