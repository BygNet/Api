import webpush from 'web-push'

import type { BygNotificationType } from '@/types'

export interface PushSubscriptionData {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushAlertPayload {
  type: BygNotificationType
  title: string
  body: string
  path: string
  tag: string
}

const subscriptionStore = new Map<number, Map<string, PushSubscriptionData>>()

const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:alerts@byg.a35.dev'
const existingPublicKey = process.env.VAPID_PUBLIC_KEY
const existingPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidKeys =
  existingPublicKey && existingPrivateKey
    ? {
        publicKey: existingPublicKey,
        privateKey: existingPrivateKey,
      }
    : webpush.generateVAPIDKeys()

webpush.setVapidDetails(vapidSubject, vapidKeys.publicKey, vapidKeys.privateKey)

export abstract class PushService {
  static getPublicKey(): string {
    return vapidKeys.publicKey
  }

  static registerSubscription(
    userId: number,
    subscription: PushSubscriptionData
  ): void {
    if (
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return
    }

    const userSubscriptions =
      subscriptionStore.get(userId) ?? new Map<string, PushSubscriptionData>()
    userSubscriptions.set(subscription.endpoint, subscription)
    subscriptionStore.set(userId, userSubscriptions)
  }

  static unregisterSubscription(userId: number, endpoint: string): void {
    const userSubscriptions = subscriptionStore.get(userId)
    if (!userSubscriptions) return

    userSubscriptions.delete(endpoint)
    if (userSubscriptions.size < 1) {
      subscriptionStore.delete(userId)
    }
  }

  static async sendToUser(
    userId: number,
    payload: PushAlertPayload
  ): Promise<void> {
    const userSubscriptions = subscriptionStore.get(userId)
    if (!userSubscriptions || userSubscriptions.size < 1) {
      return
    }

    await Promise.all(
      Array.from(userSubscriptions.values()).map(async subscription => {
        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              ...payload,
              createdDate: new Date().toISOString(),
            })
          )
        } catch (error: unknown) {
          const statusCode = Number(
            (error as { statusCode?: number }).statusCode ?? 0
          )

          if (statusCode === 404 || statusCode === 410) {
            userSubscriptions.delete(subscription.endpoint)
            return
          }

          console.error('Push send failed', error)
        }
      })
    )

    if (userSubscriptions.size < 1) {
      subscriptionStore.delete(userId)
    }
  }
}
