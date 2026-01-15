import { data } from '@/data/client'
import { users, sessions } from '@/data/tables'
import { eq } from 'drizzle-orm'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

type SignupBody = {
  email: string
  username: string
  password: string
}

type LoginBody = {
  email: string
  password: string
}

export class AuthController {
  static async signup(body: SignupBody, set: any) {
    const { email, username, password } = body

    if (!email || !username || !password) {
      set.status = 400
      return { error: 'Missing fields' }
    }

    const passHash = await argon2.hash(password)

    // Insert user - only this part can cause a 409
    try {
      await data
        .insert(users)
        .values({ email, username, passHash })
    } catch {
      set.status = 409
      return { error: 'User already exists' }
    }

    const user = await data.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      set.status = 500
      return { error: 'Failed to create user' }
    }

    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    await data.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    })

    const token = jwt.sign(
      { sub: user.id, sid: sessionId },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    }
  }

  static async login(body: LoginBody, set: any) {
    const { email, password } = body

    if (!email || !password) {
      set.status = 400
      return { error: 'Missing credentials' }
    }

    const user = await data.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      set.status = 401
      return { error: 'Invalid email or password' }
    }

    const valid = await argon2.verify(
      user.passHash,
      password
    )
    if (!valid) {
      set.status = 401
      return { error: 'Invalid email or password' }
    }

    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    await data.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    })

    const token = jwt.sign(
      { sub: user.id, sid: sessionId },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    }
  }

  static async logout(request: Request, set: any) {
    const auth = request.headers.get('authorization')
    if (!auth) {
      set.status = 204
      return
    }

    try {
      const token = auth.replace('Bearer ', '')
      const payload = jwt.verify(token, JWT_SECRET) as any

      await data
        .delete(sessions)
        .where(eq(sessions.id, payload.sid))
    } catch {
      // ignore
    }

    set.status = 204
    return
  }

  static async me(request: Request, set: any) {
    const auth = request.headers.get('authorization')
    if (!auth) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    try {
      const token = auth.replace('Bearer ', '')
      const payload = jwt.verify(token, JWT_SECRET) as any

      const session = await data.query.sessions.findFirst({
        where: eq(sessions.id, payload.sid),
      })

      if (
        !session ||
        session.expiresAt.getTime() < Date.now()
      ) {
        set.status = 401
        return { error: 'Session expired' }
      }

      const user = await data.query.users.findFirst({
        where: eq(users.id, payload.sub),
      })

      if (!user) {
        set.status = 401
        return { error: 'User not found' }
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
      }
    } catch {
      set.status = 401
      return { error: 'Invalid token' }
    }
  }
}
