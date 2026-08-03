import { Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MockTabs from '@/components/MockTabs'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { todayStr } from '@/lib/date'
import { addMockExam, deleteMockExam } from '@/lib/actions/mock'

const SUBJECTS = ['政治', '英语', '数学', '专业课']

// 常见模考名称:输入时联想提示
const COMMON_MOCK_NAMES = [
  '2023年英语真题',
  '2024年英语真题',
  '2025年英语真题',
  '2023年政治真题',
  '2024年政治真题',
  '2025年政治真题',
  '2023年数学真题',
  '2024年数学真题',
  '2025年数学真题',
  '肖秀荣四套卷',
  '肖秀荣八套卷',
  '宇哥模拟卷',
  '李林六套卷',
  '李永乐六套卷',
]

export default async function MockPage() {
  const user = await requireUser()
  const today = todayStr()

  const exams = await prisma.mockExam.findMany({
    where: { userId: user.id },
    orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
  })

  // 历史考试名称(去重,与常用名合并进联想)
  const historyNames = [...new Set(exams.map((e) => e.name))]
  const mockNameOptions = [...COMMON_MOCK_NAMES, ...historyNames.filter((n) => !COMMON_MOCK_NAMES.includes(n))]

  // 各科平均分
  const bySubject = new Map<string, { sum: number; count: number }>()
  exams.forEach((e) => {
    const cur = bySubject.get(e.subject) ?? { sum: 0, count: 0 }
    cur.sum += e.score
    cur.count += 1
    bySubject.set(e.subject, cur)
  })

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-bold text-slate-900">练习复盘</h1>
      <MockTabs active="records" />

      {/* 各科平均 */}
      {bySubject.size > 0 && (
        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...bySubject.entries()].map(([subject, { sum, count }]) => (
            <div key={subject} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-400">{subject} · 共 {count} 次</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {Math.round(sum / count)}
                <span className="ml-0.5 text-xs font-normal text-slate-400">均分</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 记录表单 */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">记录一次模考</h2>
        <form action={addMockExam} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">考试日期</label>
              <input
                name="examDate"
                type="date"
                required
                defaultValue={today}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">科目</label>
              <select
                name="subject"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="" disabled>
                  选择科目
                </option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">
              考试名称(如:2024 年英语真题一)
            </label>
            <input
              name="name"
              required
              list="mock-name-options"
              placeholder="例:2024年英语真题模拟"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <datalist id="mock-name-options">
              {mockNameOptions.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">得分</label>
              <input
                name="score"
                type="number"
                required
                min={0}
                placeholder="如 118"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">满分</label>
              <input
                name="total"
                type="number"
                required
                defaultValue={100}
                min={1}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">复盘笔记(选填)</label>
            <textarea
              name="note"
              rows={2}
              placeholder="如:阅读失分多,粗心扣了 6 分…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            保存记录
          </button>
        </form>
      </section>

      {/* 记录列表 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">历史记录</h2>
        {exams.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            还没有模考记录,考完试记得回来记一笔 📝
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {exams.map((exam) => {
              const pct = Math.round((exam.score / exam.total) * 100)
              return (
                <li key={exam.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-bold ${
                      pct >= 80
                        ? 'bg-green-50 text-green-600'
                        : pct >= 60
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {pct}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{exam.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {exam.subject} · {exam.examDate}
                      {exam.note ? ` · ${exam.note}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-slate-900">{exam.score}</div>
                    <div className="text-xs text-slate-400">/{exam.total}</div>
                  </div>
                  <form action={deleteMockExam}>
                    <input type="hidden" name="id" value={exam.id} />
                    <button
                      type="submit"
                      aria-label="删除记录"
                      className="rounded p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </AppShell>
  )
}
