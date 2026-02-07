import { data } from '@/data/client'
import { sessions, users } from '@/data/tables'
import { eq } from 'drizzle-orm'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

const JWT_SECRET: string =
  process.env.JWT_SECRET ?? 'dev-secret'
const SESSION_TTL_MS: number = 1000 * 60 * 60 * 24 * 30 // 30 days

type SignupBody = {
  email: string
  username: string
  password: string
}

type LoginBody = {
  email: string
  password: string
}

interface PublicUser {
  id: number
  email: string
  username: string
}

async function issueSession(
  userId: number
): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await data.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  const payload: jwt.JwtPayload = {
    sub: userId.toString(),
    sid: sessionId,
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  })
}

function publicUser(user: {
  id: number
  email: string
  username: string
}): PublicUser {
  return <PublicUser>{
    id: user.id,
    email: user.email,
    username: user.username,
  }
}

export class AuthController {
  static async signup(
    body: SignupBody,
    set: any
  ): Promise<{ token: string; user: PublicUser } | void> {
    const { email, username, password } = body

    if (!email || !username || !password) {
      set.status = 400
      return
    }

    const passHash: string = await argon2.hash(password)
    const usernameLower: string = username.toLowerCase()

    // Insert user - only this part can cause a 409
    try {
      await data
        .insert(users)
        .values({ email, username, usernameLower, passHash })
    } catch {
      set.status = 409
      return
    }

    const user = await data.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      set.status = 500
      return
    }

    const token: string = await issueSession(user.id)

    return {
      token,
      user: publicUser(user),
    }
  }

  static async login(
    body: LoginBody,
    set: any
  ): Promise<{ token: string; user: PublicUser } | void> {
    const { email, password } = body

    if (!email || !password) {
      set.status = 400
      return
    }

    const user = await data.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      set.status = 401
      return
    }

    const valid: boolean = await argon2.verify(
      user.passHash,
      password
    )
    if (!valid) {
      set.status = 401
      return
    }

    const token: string = await issueSession(user.id)

    return {
      token,
      user: publicUser(user),
    }
  }

  static async logout(
    request: Request,
    set: any
  ): Promise<void> {
    const auth = request.headers.get('authorization')
    if (!auth) {
      set.status = 204
      return
    }

    try {
      const token: string = auth.replace('Bearer ', '')
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

  static async me(
    request: Request,
    set: any
  ): Promise<PublicUser | void> {
    const auth = request.headers.get('authorization')
    if (!auth) {
      set.status = 401
      return
    }

    try {
      const token: string = auth.replace('Bearer ', '')
      const payload = jwt.verify(token, JWT_SECRET) as any

      const session = await data.query.sessions.findFirst({
        where: eq(sessions.id, payload.sid),
      })

      if (
        !session ||
        session.expiresAt.getTime() < Date.now()
      ) {
        set.status = 401
        return
      }

      const user = await data.query.users.findFirst({
        where: eq(users.id, payload.sub),
      })

      if (!user) {
        set.status = 401
        return
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
      }
    } catch {
      set.status = 401
      return
    }
  }

  static async hash(pass: string): Promise<string> {
    return await argon2.hash(pass)
  }
}
