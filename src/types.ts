import { InferSelectModel } from 'drizzle-orm'
import { images, posts, videos } from '@/data/tables'

export type BygPost = InferSelectModel<typeof posts>
export type BygImage = InferSelectModel<typeof images>
export type BygVideo = InferSelectModel<typeof videos>

export interface BygShop {
  title: string
  subtitle: string
  imageName: string
  tint: string
  openUrl: string
}
