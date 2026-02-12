import { ProfileQueries } from '@/profile/queries'
import { BygUserRaw } from '@/types'

interface ProfileData {
  user: Omit<BygUserRaw, 'passHash'>
  followerCount: number
  followingCount: number
  isFollowing?: boolean
}

interface UpdateProfileBody {
  bio?: string | null
  avatarUrl?: string | null
  bannerUrl?: string | null
  subscriptionState?: string | null
}

export abstract class ProfileController {
  static async getProfile(userId: number): Promise<ProfileData | null> {
    const user = await ProfileQueries.getUserProfile(userId)

    if (!user) {
      return null
    }

    const followerCount = await ProfileQueries.getFollowerCount(userId)
    const followingCount = await ProfileQueries.getFollowingCount(userId)

    const { passHash, ...userWithoutPass } = user

    return {
      user: userWithoutPass,
      followerCount,
      followingCount,
    }
  }

  static async getProfileByUsername(
    username: string,
    currentUserId?: number
  ): Promise<ProfileData | null> {
    const user = await ProfileQueries.getUserByUsername(username)

    if (!user) {
      return null
    }

    const followerCount = await ProfileQueries.getFollowerCount(user.id)
    const followingCount = await ProfileQueries.getFollowingCount(user.id)

    let isFollowing = false
    if (currentUserId) {
      isFollowing = await ProfileQueries.isFollowing(currentUserId, user.id)
    }

    const { passHash, ...userWithoutPass } = user

    return {
      user: userWithoutPass,
      followerCount,
      followingCount,
      isFollowing,
    }
  }

  static async followUser(
    followerId: number,
    followingId: number
  ): Promise<number> {
    const targetUser = await ProfileQueries.getUserProfile(followingId)

    if (!targetUser) {
      return 404
    }

    if (followerId === followingId) {
      return 400
    }

    await ProfileQueries.followUser(followerId, followingId)
    return 204
  }

  static async updateProfile(
    userId: number,
    updates: UpdateProfileBody
  ): Promise<number> {
    const user = await ProfileQueries.getUserProfile(userId)

    if (!user) {
      return 404
    }

    const result = await ProfileQueries.updateProfile(userId, updates)

    return result ? 204 : 500
  }
}
