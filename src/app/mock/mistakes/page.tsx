import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MockTabs from '@/components/MockTabs'
import OcrInput from '@/components/OcrInput'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addMistake, deleteMistake } from '@/lib/actions/mistakes'
import { MISTAKE_REASONS, MISTAKE_SUBJECTS } from '@/lib/constants'

const REASON_STYLES: Record<string, string> = {
  知识性错误: 'bg-red-50 text-red-600',
  粗心失误: 'bg-sky-50 text-sky-600',
  时间不足: 'bg-amber-50 text-amber-600',
}

const SUBJECT_STYLES: Record<string, string> = {
  政治: 'bg-rose-100 text-rose-700',
  英语: 'bg-indigo-100 text-indigo-700',
  数学: 'bg-emerald-100 text-emerald-700',
  专业课: 'bg-violet-100 text-violet-700',
}

interface MistakesPageProps {
  searchParams: Promise<{ subject?: string; reason?: string }>
}

export default async function MistakesPage({ searchParams }: MistakesPageProps) {
  const user = await requireUser()
  const { subject: filterSubject, reason: filterReason } = await searchParams

  const [allMistakes, mistakes] = await Promise.all([
    prisma.mistake.findMany({ where: { userId: user.id } }),
    prisma.mistake.findMany({
      where: {
        userId: user.id,
        ...(filterSubject && filterSubject !== '全部' ? { subject: filterSubject } : {}),
        ...(filterReason && filterReason !== '全部' ? { reason: filterReason } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // 错因统计
  const reasonCounts = MISTAKE_REASONS.map((r) => ({
    reason: r,
    count: allMistakes.filter((m) => m.reason === r).length,
  }))

  const isFiltered = (filterSubject && filterSubject !== '全部') || (filterReason && filterReason !== '全部')

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-bold text-slate-900">练习复盘</h1>
      <MockTabs active="mistakes" />

      {/* 错因统计 */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">错因分布</h2>
        <div className="grid grid-cols-3 gap-3">
          {reasonCounts.map(({ reason, count }) => (
            <div key={reason} className={`rounded-xl px-3 py-2.5 text-center ${REASON_STYLES[reason]}`}>
              <div className="text-xl font-bold">{count}</div>
              <div className="text-xs opacity-80">{reason}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {reasonCounts.reduce((s, r) => s + r.count, 0) === 0
            ? '还没有错题。每次模考后把错题记进来,优先消灭数量最多的错因'
            : '高频错因是复习优先级的第一信号'}
        </p>
      </section>

      {/* 添加错题 */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">记录错题</h2>
        <form action={addMistake} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">科目</label>
              <select
                id="mistake-subject"
                name="subject"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="" disabled>选择</option>
                {MISTAKE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">错因</label>
              <select
                name="reason"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="" disabled>选择</option>
                {MISTAKE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">章节/知识点(选填)</label>
              <input
                id="mistake-chapter"
                name="chapter"
                placeholder="如:高数-极限"
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">题目/错误描述</label>
            <OcrInput />
            <textarea
              id="mistake-question"
              name="question"
              required
              rows={2}
              placeholder="记录题目关键信息或你的错误思路…"
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 [field-sizing:content]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">正确解法/复盘(选填)</label>
            <textarea
              id="mistake-solution"
              name="solution"
              rows={2}
              placeholder="正确思路、关键步骤或提醒自己的话…"
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 [field-sizing:content]"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            保存错题
          </button>
        </form>
      </section>

      {/* 筛选 + 列表 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">错题列表</h2>
          <div className="ml-auto flex flex-wrap gap-1.5 text-xs">
            {['全部', ...MISTAKE_SUBJECTS].map((s) => (
              <Link
                key={s}
                href={s === '全部' ? '/mock/mistakes' : `/mock/mistakes?subject=${s}`}
                className={`rounded-full px-2.5 py-1 transition ${
                  (filterSubject ?? '全部') === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {isFiltered && (
          <p className="mb-3 text-xs text-slate-400">
            当前筛选:
            {filterSubject && filterSubject !== '全部' && <span> 科目:{filterSubject}</span>}
            {filterReason && filterReason !== '全部' && <span> 错因:{filterReason}</span>}
            <Link href="/mock/mistakes" className="ml-2 font-medium text-indigo-600 hover:underline">
              清除筛选
            </Link>
          </p>
        )}

        {mistakes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            {isFiltered ? '没有符合筛选的错题' : '还没有错题,考完试记得把错题记进来 📝'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mistakes.map((m) => (
              <li key={m.id} className="py-3.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SUBJECT_STYLES[m.subject] ?? 'bg-slate-100 text-slate-600'}`}>
                    {m.subject}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REASON_STYLES[m.reason] ?? 'bg-slate-100 text-slate-600'}`}>
                    {m.reason}
                  </span>
                  {m.chapter && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {m.chapter}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-300">
                    {m.createdAt.toLocaleDateString('zh-CN')}
                  </span>
                  <form action={deleteMistake}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      aria-label="删除错题"
                      className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
                <p className="text-sm text-slate-800">{m.question}</p>
                {m.solution && (
                  <p className="mt-1.5 rounded-lg bg-emerald-50/60 px-2.5 py-1.5 text-xs leading-relaxed text-emerald-800">
                    <span className="font-medium">✅ </span>
                    {m.solution}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  )
}
