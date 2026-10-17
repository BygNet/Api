import type { AnyElysia } from 'elysia'

export type RouteApp = AnyElysia

export function requireUser(
  userId: number | null,
  set: { status: number | string }
): userId is number {
  if (userId) return true

  set.status = 401
  return false
}

export function parseLimit(value: string | undefined, fallback: number) {
  const limit = Number(value ?? fallback)
  return Number.isFinite(limit) ? limit : fallback
}

export function parseRouteId(value: string): number | null {
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}
