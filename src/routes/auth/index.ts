import { t } from 'elysia'

import { AuthController } from '@/auth/controller'
import {
  AuthGrantSchema,
  EnableTwoFactorSchema,
  SessionExpirySchema,
  VerifyEmailSchema,
} from '@/schemas'
import { requireUser, type RouteApp } from '../helpers'

export function registerAuthRoutes(app: RouteApp): RouteApp {
  return app
    .post(
      '/auth/signup',
      async ({ body, set, request }) => {
        const result = await AuthController.signup(body as any, set, request)
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
      async ({ body, set, request }) => {
        const result = await AuthController.login(body as any, set, request)
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
          description: 'Authenticate a user and return a session token',
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
      '/auth/grants',
      async ({ body, userId, set }) => {
        if (!requireUser(userId, set)) return null

        return await AuthController.createGrant(userId, body.redirectUri, set)
      },
      {
        body: AuthGrantSchema,
        response: {
          200: t.Ref('Any'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Auth'],
          description: 'Create a one-time service login grant',
        },
      }
    )
    .post(
      '/auth/exchange',
      async ({ body, request, set }) => {
        return await AuthController.exchangeGrant(
          body.code,
          body.redirectUri,
          request,
          set
        )
      },
      {
        body: t.Object({
          code: t.String(),
          redirectUri: t.String(),
        }),
        response: {
          200: t.Ref('AuthSuccess'),
          400: t.Ref('Empty'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Auth'],
          description: 'Exchange a one-time service login grant',
        },
      }
    )
    .get(
      '/auth/sessions',
      async ({ userId, request, set }) => {
        if (!requireUser(userId, set)) return null

        return await AuthController.getSessions(userId, request)
      },
      {
        response: {
          200: t.Ref('AnyArray'),
          401: t.Ref('Empty'),
        },
        detail: {
          tags: ['Auth'],
          description: 'List active sessions for the current user',
        },
      }
    )
    .delete(
      '/auth/sessions/:id',
      async ({ userId, params, set }) => {
        if (!requireUser(userId, set)) return null

        await AuthController.removeSession(userId, params.id, set)
        return { status: 'ok' }
      },
      {
        response: {
          200: t.Ref('Status'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
        },
        detail: {
          tags: ['Auth'],
          description: 'Revoke an active session',
        },
      }
    )
    .patch(
      '/auth/sessions/:id',
      async ({ body, userId, params, request, set }) => {
        if (!requireUser(userId, set)) return null

        return await AuthController.setSessionExpiry(
          userId,
          params.id,
          body.neverExpire,
          request,
          set
        )
      },
      {
        body: SessionExpirySchema,
        response: {
          200: t.Ref('Any'),
          401: t.Ref('Empty'),
          404: t.Ref('Empty'),
        },
        detail: {
          tags: ['Auth'],
          description: 'Change whether a session expires',
        },
      }
    )
    .post(
      '/auth/verify-email',
      async ({ body, set, userId }) => {
        if (!requireUser(userId, set)) return null

        set.status = await AuthController.verifyEmail(userId, body.code)

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
          description: 'Verify the current user email address',
        },
      }
    )
    .post(
      '/auth/resend-email-verification',
      async ({ set, userId }) => {
        if (!requireUser(userId, set)) return null

        set.status = await AuthController.resendEmailVerification(userId)

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
          description: 'Resend the current user email verification code',
        },
      }
    )
    .get(
      '/auth/2fa/setup',
      async ({ set, userId }) => {
        if (!requireUser(userId, set)) return null

        const result = await AuthController.createTwoFactorSetup(userId)

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
        if (!requireUser(userId, set)) return null

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
          description: 'Enable authenticator app 2FA for the current user',
        },
      }
    )
    .post(
      '/auth/2fa/disable',
      async ({ set, userId }) => {
        if (!requireUser(userId, set)) return null

        const result = await AuthController.disableTwoFactor(userId)

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
          description: 'Disable authenticator app 2FA for the current user',
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
}
