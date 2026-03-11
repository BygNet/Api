import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { data } from '@/data/client'
import { sessions, users } from '@/data/tables'
import type {
  BygLiveMessageEvent,
  BygLiveTypingEvent,
  BygMessage,
} from '@/types'

type RealtimeSocket = {
  send: (payload: string) => void
  close: () => void
}

type ClientRealtimeEvent =
  | {
      type: 'auth'
      token: string
    }
  | {
      type: 'typing'
      toUserId: number
      isTyping: boolean
    }

interface SocketMeta {
  userId: number
  username: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const socketsByUserId = new Map<number, Set<RealtimeSocket>>()
const socketMeta = new WeakMap<RealtimeSocket, SocketMeta>()

function sendSocketEvent(socket: RealtimeSocket, payload: unknown): void {
  socket.send(JSON.stringify(payload))
}

function normalizeSocketIdentity(socket: RealtimeSocket): RealtimeSocket {
  const candidate = (socket as { raw?: unknown }).raw
  if (!candidate || typeof candidate !== 'object') {
    return socket
  }

  if (
    typeof (candidate as RealtimeSocket).send === 'function' &&
    typeof (candidate as RealtimeSocket).close === 'function'
  ) {
    return candidate as RealtimeSocket
  }

  return socket
}

function normalizeUserId(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.trunc(input)
  }

  if (typeof input === 'string') {
    const normalized = input.trim()
    if (!normalized) return null

    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed)
    }
  }

  return null
}

function normalizeTypingFlag(input: unknown): boolean | null {
  if (typeof input === 'boolean') {
    return input
  }

  if (input === 'true') return true
  if (input === 'false') return false
  return null
}

function parseRealtimeEvent(rawMessage: unknown): ClientRealtimeEvent | null {
  let normalized: unknown = rawMessage

  if (typeof rawMessage === 'string') {
    try {
      normalized = JSON.parse(rawMessage)
    } catch {
      return null
    }
  }

  if (!normalized || typeof normalized !== 'object') {
    return null
  }

  const payload = normalized as Record<string, unknown>
  if (payload.type === 'auth' && typeof payload.token === 'string') {
    return {
      type: 'auth',
      token: payload.token,
    }
  }

  const normalizedToUserId = normalizeUserId(payload.toUserId)
  const normalizedTypingFlag = normalizeTypingFlag(payload.isTyping)
  if (
    payload.type === 'typing' &&
    normalizedToUserId !== null &&
    normalizedTypingFlag !== null
  ) {
    return {
      type: 'typing',
      toUserId: normalizedToUserId,
      isTyping: normalizedTypingFlag,
    }
  }

  return null
}

async function resolveSocketAuth(token: string): Promise<SocketMeta | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sid?: string
      sub?: string
    }

    if (!payload.sid || !payload.sub) {
      return null
    }

    const session = await data.query.sessions.findFirst({
      where: eq(sessions.id, payload.sid),
    })
    if (!session || session.expiresAt.getTime() < Date.now()) {
      return null
    }

    const userId = Number(payload.sub)
    if (!Number.isFinite(userId)) {
      return null
    }

    const user = await data.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (!user) {
      return null
    }

    return {
      userId: user.id,
      username: user.username,
    }
  } catch {
    return null
  }
}

export abstract class MessagesRealtimeService {
  static handleOpen(socket: RealtimeSocket): void {
    const socketIdentity = normalizeSocketIdentity(socket)
    sendSocketEvent(socketIdentity, {
      type: 'auth:required',
    })
  }

  static async handleMessage(
    socket: RealtimeSocket,
    rawMessage: unknown
  ): Promise<void> {
    const socketIdentity = normalizeSocketIdentity(socket)
    const event = parseRealtimeEvent(rawMessage)
    if (!event) {
      sendSocketEvent(socketIdentity, {
        type: 'error',
        reason: 'invalid_payload',
      })
      return
    }

    if (event.type === 'auth') {
      const resolved = await resolveSocketAuth(event.token)
      if (!resolved) {
        sendSocketEvent(socketIdentity, {
          type: 'auth:error',
        })
        socketIdentity.close()
        return
      }

      this.registerSocket(socketIdentity, resolved)
      sendSocketEvent(socketIdentity, {
        type: 'auth:ok',
        userId: resolved.userId,
        username: resolved.username,
      })
      return
    }

    const sender = socketMeta.get(socketIdentity)
    if (!sender) {
      sendSocketEvent(socketIdentity, {
        type: 'auth:error',
      })
      return
    }

    if (event.type === 'typing') {
      if (event.toUserId === sender.userId) return

      this.emitTyping({
        fromUserId: sender.userId,
        fromUsername: sender.username,
        toUserId: event.toUserId,
        isTyping: event.isTyping,
      })
    }
  }

  static handleClose(socket: RealtimeSocket): void {
    this.unregisterSocket(normalizeSocketIdentity(socket))
  }

  static broadcastMessage(message: BygMessage): void {
    const event: BygLiveMessageEvent = {
      type: 'message:new',
      message,
    }

    this.sendToUser(message.senderId, event)

    if (message.recipientId !== message.senderId) {
      this.sendToUser(message.recipientId, event)
    }
  }

  static emitTyping(payload: {
    fromUserId: number
    fromUsername: string
    toUserId: number
    isTyping: boolean
  }): void {
    const event: BygLiveTypingEvent = {
      type: 'typing',
      fromUserId: payload.fromUserId,
      fromUsername: payload.fromUsername,
      isTyping: payload.isTyping,
    }

    this.sendToUser(payload.toUserId, event)
  }

  private static registerSocket(
    socket: RealtimeSocket,
    meta: SocketMeta
  ): void {
    const existingMeta = socketMeta.get(socket)
    if (existingMeta?.userId === meta.userId) {
      return
    }

    if (existingMeta) {
      this.unregisterSocket(socket)
    }

    socketMeta.set(socket, meta)
    const userSockets =
      socketsByUserId.get(meta.userId) ?? new Set<RealtimeSocket>()
    userSockets.add(socket)
    socketsByUserId.set(meta.userId, userSockets)
  }

  private static unregisterSocket(socket: RealtimeSocket): void {
    const meta = socketMeta.get(socket)
    if (!meta) return

    socketMeta.delete(socket)
    const userSockets = socketsByUserId.get(meta.userId)
    if (!userSockets) return

    userSockets.delete(socket)
    if (userSockets.size < 1) {
      socketsByUserId.delete(meta.userId)
    }
  }

  private static sendToUser(userId: number, payload: unknown): void {
    const sockets = socketsByUserId.get(userId)
    if (!sockets || sockets.size < 1) return

    const staleSockets: RealtimeSocket[] = []

    for (const socket of sockets) {
      try {
        sendSocketEvent(socket, payload)
      } catch {
        staleSockets.push(socket)
      }
    }

    for (const socket of staleSockets) {
      this.unregisterSocket(socket)
    }
  }
}
