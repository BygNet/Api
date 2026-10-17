import { t } from 'elysia'

import {
  AnyArraySchema,
  AnySchema,
  EmptySchema,
  HtmlSchema,
  PushPublicKeySchema,
  ShortLinkSchema,
  StatusSchema,
  StringSchema,
} from './common'
import { AskArraySchema, AskSchema, CommentArraySchema } from './content'
import {
  AuthSuccessSchema,
  TwoFactorChallengeSchema,
  TwoFactorSetupSchema,
  UserSchema,
} from './auth'

export const SongLinkInfoSchema = t.Object({
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

export const apiModels = {
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
}
