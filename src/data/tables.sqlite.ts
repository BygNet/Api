import {
  sqliteTable,
  integer,
  text,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passHash: text('pass_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', {
    mode: 'timestamp_ms',
  }).notNull(),
})

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  commentCount: integer('comment_count')
    .notNull()
    .default(0),
})

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  commentCount: integer('comment_count')
    .notNull()
    .default(0),
})

export const postComments = sqliteTable('post_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
})

export const imageComments = sqliteTable('image_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageId: integer('image_id')
    .notNull()
    .references(() => images.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(strftime('%s','now') * 1000)`),
})
