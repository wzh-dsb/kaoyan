import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const SESSION_COOKIE = 'session'
export const SESSION_DAYS = 30

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await prisma.session.create({ data: { token, userId, expiresAt } })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
  // 小程序:Authorization: Bearer <token>(cookie 无法在非浏览器环境自动携带)
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  // 网页:session cookie
  const cookieStore = await cookies()
  const token = headerToken ?? cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null

  // 过期清理
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } }).catch(() => {})
    return null
  }
  return session
}

/** 供 Server Action / 页面使用:未登录直接跳转登录页 */
export async function requireUser() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session.user
}
