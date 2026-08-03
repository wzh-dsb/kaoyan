'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type AuthState = { error?: string } | null

export async function register(_prev: AuthState, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const nickname = String(formData.get('nickname') ?? '').trim()

  if (!EMAIL_RE.test(email)) return { error: '邮箱格式不正确' }
  if (password.length < 6) return { error: '密码至少 6 位' }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return { error: '该邮箱已注册,请直接登录' }

  const user = await prisma.user.create({
    data: {
      email,
      nickname: nickname || null,
      passwordHash: await hashPassword(password),
    },
  })

  await createSession(user.id)
  redirect('/')
}

export async function login(_prev: AuthState, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!EMAIL_RE.test(email) || !password) return { error: '请输入邮箱和密码' }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: '邮箱或密码错误' }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return { error: '邮箱或密码错误' }

  await createSession(user.id)
  redirect('/')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
