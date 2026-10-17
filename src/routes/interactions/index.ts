import { t } from 'elysia'

import { CommentsController } from '@/comments/controller'
import { LikeController } from '@/like/controller'
import { ShareController } from '@/share/controller'
import { CommentSchema } from '@/schemas'
import { type RouteApp, requireUser } from '../helpers'

export function registerInteractionRoutes(app: RouteApp): RouteApp {
  return app
    .post(
      '/like-post/:id',
      async ({ params, set }): Promise<null> => {
        set.status = await LikeController.likePost(Number(params.id))
        return null
      },
      {
        response: { 200: t.Ref('Empty') },
        detail: {
          tags: ['Interact'],
          description: 'Like or unlike a post',
        },
      }
    )
    .post(
      '/like-image/:id',
      async ({ params, set }): Promise<null> => {
        set.status = await LikeController.likeImage(Number(params.id))
        return null
      },
      {
        response: { 200: t.Ref('Empty') },
        detail: {
          tags: ['Interact'],
          description: 'Like or unlike an image',
        },
      }
    )
    .get(
      '/share-post/:id',
      async ({ params }): Promise<string> =>
        ShareController.sharePost(Number(params.id)),
      {
        response: { 200: t.Ref('String') },
        detail: {
          tags: ['Share'],
          description: 'Generate a shareable link for a post',
        },
      }
    )
    .get(
      '/share-image/:id',
      async ({ params }): Promise<string> =>
        ShareController.shareImage(Number(params.id)),
      {
        response: { 200: t.Ref('String') },
        detail: {
          tags: ['Share'],
          description: 'Generate a shareable link for an image',
        },
      }
    )
    .get(
      '/post-comments/:id',
      async ({ params }) =>
        await CommentsController.getPostComments(Number(params.id)),
      {
        response: { 200: t.Ref('CommentArray') },
        detail: {
          tags: ['Interact'],
          description: 'Get comments for a post',
        },
      }
    )
    .post(
      '/comment-post',
      async ({ body, set, userId }): Promise<null> => {
        if (!requireUser(userId, set)) return null

        set.status = await CommentsController.commentPost(body as any, userId)
        return null
      },
      {
        body: CommentSchema,
        response: {
          200: t.Ref('Empty'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
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
      async ({ params }) =>
        await CommentsController.getImageComments(Number(params.id)),
      {
        response: { 200: t.Ref('CommentArray') },
        detail: {
          tags: ['Interact'],
          description: 'Get comments for an image',
        },
      }
    )
    .post(
      '/comment-image',
      async ({ body, set, userId }): Promise<null> => {
        if (!requireUser(userId, set)) return null

        set.status = await CommentsController.commentImage(body as any, userId)
        return null
      },
      {
        body: CommentSchema,
        response: {
          200: t.Ref('Empty'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
          500: t.Ref('Empty'),
        },
        detail: {
          tags: ['Interact'],
          description: 'Add a comment to an image',
        },
      }
    )
}
