import {
  pgTable,
  integer,
  serial,
  text,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passHash: text('pass_hash').notNull(),
  emailVerificationCode: text('email_verification_code'),
  twoFactorSecret: text('2fa_secret'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  bannerUrl: text('banner_url'),
  color: text('color'),
  subscriptionState: text('subscription_state'),
  verification: text('verification', {
    enum: ['notable', 'organization', 'government', 'identity'],
  }),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
  }).notNull(),
})

export const posts = pgTable('posts', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
})

export const images = pgTable('images', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
})

export const postComments = pgTable('post_comments', {
  id: integer('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const imageComments = pgTable('image_comments', {
  id: integer('id').primaryKey(),
  imageId: integer('image_id')
    .notNull()
    .references(() => images.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const followings = pgTable('followings', {
  id: integer('id').primaryKey(),
  followerId: integer('follower_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer('following_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull().default(''),
  sharedPostId: integer('shared_post_id').references(() => posts.id, {
    onDelete: 'set null',
  }),
  sharedImageId: integer('shared_image_id').references(() => images.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const shortLinks = pgTable('short_links', {
  slug: text('slug').primaryKey(),
  destinationUrl: text('destination_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
