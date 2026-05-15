import {
  check,
  pgTable,
  integer,
  index,
  uniqueIndex,
  serial,
  text,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passHash: text('pass_hash').notNull(),
  emailVerificationCode: text('email_verification_code'),
  twoFactorSecret: text('2fa_secret'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  displayName: text('display_name'),
  pronouns: text('pronouns'),
  songLinkUrl: text('song_link_url'),
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
  id: serial('id').primaryKey(),
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
  id: serial('id').primaryKey(),
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
  id: serial('id').primaryKey(),
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
  id: serial('id').primaryKey(),
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
  id: serial('id').primaryKey(),
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

export const asks = pgTable(
  'asks',
  {
    id: serial('id').primaryKey(),
    recipientId: integer('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [index('asks_recipient_id_idx').on(table.recipientId)]
)

export const messageConversations = pgTable(
  'message_conversations',
  {
    id: serial('id').primaryKey(),
    type: text('type', { enum: ['direct', 'group'] }).notNull(),
    name: text('name'),
    title: text('title'),
    imageUrl: text('image_url'),
    description: text('description'),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [
    check(
      'message_conversations_type_check',
      sql`${table.type} in ('direct', 'group')`
    ),
  ]
)

export const messageConversationMembers = pgTable(
  'message_conversation_members',
  {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => messageConversations.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    invitedById: integer('invited_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [
    uniqueIndex('message_conversation_members_unique').on(
      table.conversationId,
      table.userId
    ),
    index('message_conversation_members_user_id_idx').on(table.userId),
  ]
)

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => messageConversations.id, { onDelete: 'cascade' }),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: integer('recipient_id').references(() => users.id, {
      onDelete: 'set null',
    }),
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
  },
  table => [index('messages_conversation_id_idx').on(table.conversationId)]
)

export const shortLinks = pgTable('short_links', {
  slug: text('slug').primaryKey(),
  destinationUrl: text('destination_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
