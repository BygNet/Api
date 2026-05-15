import { ProfileQueries } from '@/profile/queries'
import { PushService } from '@/push/service'
import type { BygAsk } from '@/types'

import { AsksQueries } from './queries'

type SubmitAskResult =
  | {
      ok: true
      ask: BygAsk
    }
  | {
      ok: false
      code: 'empty_ask' | 'recipient_not_found'
    }

function summarizeAsk(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 80)}…`
}

export abstract class AsksController {
  static async getAsks(userId: number, limit: number): Promise<BygAsk[]> {
    return await AsksQueries.getUserAsks(userId, limit)
  }

  static async submitAsk(
    username: string,
    content: string
  ): Promise<SubmitAskResult> {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { ok: false, code: 'empty_ask' }
    }

    const recipient = await ProfileQueries.getUserByUsername(username)
    if (!recipient) {
      return { ok: false, code: 'recipient_not_found' }
    }

    const ask = await AsksQueries.createAsk(recipient.id, trimmedContent)

    await PushService.sendToUser(recipient.id, {
      type: 'ask',
      title: 'New ask',
      body: summarizeAsk(trimmedContent),
      path: '/asks',
      tag: `ask-${ask.id}`,
    })

    return { ok: true, ask }
  }
}
