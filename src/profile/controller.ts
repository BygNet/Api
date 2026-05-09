import { ProfileQueries } from '@/profile/queries'
import { PushService } from '@/push/service'
import { BygUserRaw, BygUserSuggestion } from '@/types'
import { UpdateProfileBody } from '@/schemas'

interface ProfileData {
  user: Omit<
    BygUserRaw,
    'passHash' | 'emailVerificationCode' | 'twoFactorSecret'
  >
  followerCount: number
  followingCount: number
  isFollowing?: boolean
}

function hasPaidProfileColorAccess(
  subscriptionState: string | null | undefined
): boolean {
  return subscriptionState != null && subscriptionState !== 'free'
}

function normalizeSongLinkUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    if (
      parsed.hostname !== 'song.link' &&
      parsed.hostname !== 'www.song.link' &&
      parsed.hostname !== 'odesli.co' &&
      parsed.hostname !== 'www.odesli.co'
    ) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

export abstract class ProfileController {
  static async getUserSuggestions(
    query: string,
    limit: number
  ): Promise<BygUserSuggestion[]> {
    return await ProfileQueries.getUserSuggestionsByPrefix(
      query,
      Math.max(1, Math.min(limit, 12))
    )
  }

  static async getProfile(userId: number): Promise<ProfileData | null> {
    const user = await ProfileQueries.getUserProfile(userId)

    if (!user) {
      return null
    }

    const followerCount = await ProfileQueries.getFollowerCount(userId)
    const followingCount = await ProfileQueries.getFollowingCount(userId)

    const {
      passHash,
      emailVerificationCode,
      twoFactorSecret,
      ...userWithoutPass
    } = user

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

    const {
      passHash,
      emailVerificationCode,
      twoFactorSecret,
      ...userWithoutPass
    } = user

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

    const didFollow = await ProfileQueries.followUser(followerId, followingId)

    if (didFollow) {
      const follower = await ProfileQueries.getUserProfile(followerId)

      if (follower) {
        await PushService.sendToUser(followingId, {
          type: 'follow',
          title: 'New follower',
          body: `${follower.username} followed you`,
          path: `/u/${follower.username}`,
          tag: `follow-${follower.id}`,
        })
      }
    }

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

    if (
      updates.color !== undefined &&
      updates.color !== null &&
      !hasPaidProfileColorAccess(user.subscriptionState)
    ) {
      return 403
    }

    const normalizedUpdates: UpdateProfileBody = {
      ...updates,
    }

    if (typeof updates.songLinkUrl === 'string') {
      const normalizedUrl = normalizeSongLinkUrl(updates.songLinkUrl)
      if (!normalizedUrl) {
        return 400
      }
      normalizedUpdates.songLinkUrl = normalizedUrl
    }

    const result = await ProfileQueries.updateProfile(
      userId,
      normalizedUpdates
    )

    return result ? 204 : 500
  }
}
