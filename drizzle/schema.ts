import { pgTable, pgSequence } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const usersIdSeq = pgSequence('users_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
})
export const postsIdSeq = pgSequence('posts_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
})
export const postCommentsIdSeq = pgSequence('post_comments_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
})
export const imagesIdSeq = pgSequence('images_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
})
export const imageCommentsIdSeq = pgSequence('image_comments_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
})
export const followingsIdSeq = pgSequence('followings_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
})
