'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import type { AuthState } from '@/lib/actions/auth'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    register,
    null,
  )

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🎯</div>
          <h1 className="text-2xl font-bold text-slate-900">创建账号</h1>
          <p className="mt-1 text-sm text-slate-500">开始你的考研作战记录</p>
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
            <label htmlFor="nickname" className="mb-1 block text-sm font-medium text-slate-700">
              昵称(选填)
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              autoComplete="nickname"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="上岸小分队队长"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              密码(至少 6 位)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="设置登录密码"
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
            {pending ? '注册中…' : '注 册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          已有账号?
          <Link href="/login" className="ml-1 font-medium text-indigo-600 hover:underline">
            直接登录
          </Link>
        </p>
      </div>
    </div>
  )
}
