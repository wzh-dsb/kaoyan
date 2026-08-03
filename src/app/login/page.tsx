'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import type { AuthState } from '@/lib/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    null,
  )

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">📚</div>
          <h1 className="text-2xl font-bold text-slate-900">考研工作台</h1>
          <p className="mt-1 text-sm text-slate-500">每天清楚该做什么,离目标越来越近</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="请输入密码"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? '登录中…' : '登 录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          还没有账号?
          <Link href="/register" className="ml-1 font-medium text-indigo-600 hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}
