import { t } from 'elysia'

import { CreateController } from '@/create/controller'
import { CreatePostSchema, UploadImageSchema } from '@/schemas'
import { requireUser, type RouteApp } from '../helpers'

export function registerCreateRoutes(app: RouteApp): RouteApp {
  return app
    .post(
      '/create-post',
      async ({ body, set, userId }): Promise<null> => {
        if (!requireUser(userId, set)) return null

        set.status = await CreateController.createPost(body, userId)
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
        if (!requireUser(userId, set)) return null

        set.status = await CreateController.uploadImage(body, userId)
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
}
