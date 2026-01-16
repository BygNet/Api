import { InferSelectModel } from 'drizzle-orm'
import { images, posts } from '@/data/tables'

// ---- Raw DB models (internal) ----
export type BygPostRaw = InferSelectModel<typeof posts>
export type BygImageRaw = InferSelectModel<typeof images>

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

export interface BygShop {
  title: string
  subtitle: string
  imageName: string
  tint: string
  openUrl: string
}
