import {data} from '@/data/client'
import {and, eq, sql} from 'drizzle-orm'
import {followings, users} from '@/data/tables'
import {BygUserRaw, BygUserSuggestion} from '@/types'

interface MentionTargetUser {
  id: number
  username: string
  avatarUrl: string | null
  subscriptionState: string
}

export abstract class ProfileQueries {
  static async getUserProfile(userId: number): Promise<BygUserRaw | null> {
    const user: BygUserRaw[] = await data
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user[0] ?? null
  }

  static async getUserByUsername(username: string): Promise<BygUserRaw | null> {
    const user: BygUserRaw[] = await data
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return user[0] ?? null
  }

  static async getUsersByUsernames(
    usernames: string[]
  ): Promise<MentionTargetUser[]> {
    const normalizedUsernames = [
      ...new Set(
        usernames
          .map(username => username.trim().toLowerCase())
          .filter(Boolean)
      ),
    ]

    if (normalizedUsernames.length < 1) {
      return []
    }

    const resolvedUsers: MentionTargetUser[] = []

    for (const normalizedUsername of normalizedUsernames) {
      const user = await data.query.users.findFirst({
        where: sql`lower(${users.username}) = ${normalizedUsername}`,
      })

      if (!user) continue

      resolvedUsers.push({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        subscriptionState: user.subscriptionState ?? 'free',
      })
    }

    return resolvedUsers
  }

  static async getUserSuggestionsByPrefix(
    query: string,
    limit: number
  ): Promise<BygUserSuggestion[]> {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return []
    }

    const rows = await data
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        subscriptionState: users.subscriptionState,
      })
      .from(users)
      .where(sql`lower(${users.username}) like ${`${normalizedQuery}%`}`)
      .orderBy(sql`lower(${users.username}) asc`)
      .limit(limit)

    return rows.map(
      (row: {
        id: number
        username: string
        avatarUrl: string | null
        subscriptionState: string | null
      }) => ({
        id: row.id,
        username: row.username,
        avatarUrl: row.avatarUrl,
        subscriptionState: row.subscriptionState ?? 'free',
      })
    )
  }

  static async followUser(
    followerId: number,
    followingId: number
  ): Promise<boolean> {
    if (followerId === followingId) return false

    const existingFollow = await data
      .select()
      .from(followings)
      .where(
        and(
          eq(followings.followerId, followerId),
          eq(followings.followingId, followingId)
        )
      )
      .limit(1)

    if (existingFollow.length > 0) {
      await data
        .delete(followings)
        .where(
          and(
            eq(followings.followerId, followerId),
            eq(followings.followingId, followingId)
          )
        )
      return false
    } else {
      await data.insert(followings).values({
        followerId,
        followingId,
      })
      return true
    }
  }

  static async updateProfile(
    userId: number,
    updates: {
      bio?: string | null
      avatarUrl?: string | null
      bannerUrl?: string | null
      subscriptionState?: string | null
    }
  ): Promise<boolean> {
    const result = await data
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))

    return !!result
  }

  static async getFollowerCount(userId: number): Promise<number> {
    const result = await data
      .select()
      .from(followings)
      .where(eq(followings.followingId, userId))

    return result.length
  }

  static async getFollowingCount(userId: number): Promise<number> {
    const result = await data
      .select()
      .from(followings)
      .where(eq(followings.followerId, userId))

    return result.length
  }

  static async isFollowing(
    followerId: number,
    followingId: number
  ): Promise<boolean> {
    const result = await data
      .select()
      .from(followings)
      .where(
        and(
          eq(followings.followerId, followerId),
          eq(followings.followingId, followingId)
        )
      )
      .limit(1)

    return result.length > 0
  }
}
