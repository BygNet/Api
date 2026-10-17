import { t } from 'elysia'

import { ProfileController } from '@/profile/controller'
import { UpdateProfileSchema } from '@/schemas'
import { type RouteApp, requireUser } from '../helpers'

export function registerProfileRoutes(app: RouteApp): RouteApp {
  return app
    .get(
      '/profile/:username',
      async ({ params, userId }) =>
        await ProfileController.getProfileByUsername(
          params.username,
          userId ?? undefined
        ),
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
        if (!requireUser(userId, set)) return null
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
          description: 'Get the current authenticated user profile',
        },
      }
    )
    .post(
      '/follow-user/:id',
      async ({ params, set, userId }): Promise<null> => {
        if (!requireUser(userId, set)) return null

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
        if (!requireUser(userId, set)) return null

        set.status = await ProfileController.updateProfile(userId, body as any)
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
}
