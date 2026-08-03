'use client'

import { useEffect, useState, useActionState } from 'react'
import SearchSelect from '@/components/SearchSelect'
import { updateProfile } from '@/lib/actions/profile'
import type { ProfileState } from '@/lib/actions/profile'
import { SCHOOLS } from '@/lib/data/schools'
import { MAJORS } from '@/lib/data/majors'

interface ProfileFormProps {
  examDate: string
  targetSchool: string
  targetMajor: string
  nickname: string
}

/** 考研信息表单:保存后有成功反馈 */
export default function ProfileForm({
  examDate,
  targetSchool,
  targetMajor,
  nickname,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  )
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (state?.ok) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">考研日期</label>
        <input
          name="examDate"
          type="date"
          defaultValue={examDate}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1 text-xs text-slate-400">首页将显示距考研的倒计时天数</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">目标院校(选填)</label>
        <SearchSelect
          name="targetSchool"
          options={SCHOOLS}
          defaultValue={targetSchool}
          placeholder="搜索院校,如:浙江大学"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">目标专业(选填)</label>
        <SearchSelect
          name="targetMajor"
          options={MAJORS}
          defaultValue={targetMajor}
          placeholder="搜索专业,如:计算机技术"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">昵称(选填)</label>
        <input
          name="nickname"
          type="text"
          defaultValue={nickname}
          placeholder="考研人"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
        {pending ? '保存中…' : '保存设置'}
      </button>

      {showSaved && (
        <p className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-sm font-medium text-emerald-600">
          ✓ 已保存
        </p>
      )}
    </form>
  )
}
