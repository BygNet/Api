import {
  sqliteTable,
  integer,
  text,
} from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  author: text('author').notNull(),
  createdDate: text('createdDate').notNull(),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
})

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  imageUrl: text('imageUrl').notNull(),
  author: text('author').notNull(),
  createdDate: text('createdDate').notNull(),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
})

export const videos = sqliteTable('videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  videoUrl: text('videoUrl').notNull(),
  createdDate: text('createdDate').notNull(),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
})
