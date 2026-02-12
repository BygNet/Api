import { data } from '@/data/client'
import { eq, and } from 'drizzle-orm'
import { users, followings } from '@/data/tables'
import { BygUserRaw } from '@/types'

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
