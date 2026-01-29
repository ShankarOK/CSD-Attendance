import { SignJWT, jwtVerify } from 'jose'

export type UserRole = 'admin' | 'teacher'

export type AuthUser = {
  id: number
  username: string
  role: UserRole
  teacherId: number | null
}

export type AuthTokenPayload = {
  userId: number
  username: string
  role: UserRole
  teacherId: number | null
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export const AUTH_COOKIE_NAME = 'auth_token'

export function getAuthCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return await new SignJWT({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    teacherId: payload.teacherId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 7)
    .sign(getJwtSecretKey())
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    })

    const userId = typeof payload.userId === 'number' ? payload.userId : Number(payload.userId)
    if (!Number.isFinite(userId)) return null
    const username = typeof payload.username === 'string' ? payload.username : null
    const role = payload.role === 'admin' || payload.role === 'teacher' ? payload.role : null
    const teacherId =
      payload.teacherId === null || payload.teacherId === undefined
        ? null
        : typeof payload.teacherId === 'number'
          ? payload.teacherId
          : Number(payload.teacherId)

    if (!username || !role) return null
    if (teacherId !== null && !Number.isFinite(teacherId)) return null

    return { userId, username, role, teacherId }
  } catch {
    return null
  }
}

