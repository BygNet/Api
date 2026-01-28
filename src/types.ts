import { InferSelectModel } from 'drizzle-orm'
import {
  images,
  posts,
  postComments,
  imageComments,
} from '@/data/tables'

// ---- Raw DB models (internal) ----
export type BygPostRaw = InferSelectModel<typeof posts>
export type BygImageRaw = InferSelectModel<typeof images>
export type BygPostCommentRaw = InferSelectModel<
  typeof postComments
>
export type BygImageCommentRaw = InferSelectModel<
  typeof imageComments
>

// ---- API / frontend-facing models ----
export type BygPost = Omit<
  BygPostRaw,
  'authorId' | 'createdAt'
> & {
  author: string
  createdDate: string
}

export type BygImage = Omit<
  BygImageRaw,
  'authorId' | 'createdAt'
> & {
  author: string
  createdDate: string
}

export type BygComment = {
  id: number
  author: string
  content: string
  createdDate: string
}

export interface BygShop {
  title: string
  subtitle: string
  imageName: string
  tint: string
  openUrl: string
}
