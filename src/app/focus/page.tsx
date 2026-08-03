import AppShell from '@/components/AppShell'
import PomodoroTimer from '@/components/PomodoroTimer'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { todayStr } from '@/lib/date'

export default async function FocusPage() {
  const user = await requireUser()
  const today = todayStr()

  const [todaySessions, recentSessions] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId: user.id },
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
  ])

  const todayMinutes = todaySessions
    .filter((s) => s.startedAt.toISOString().slice(0, 10) === today)
    .reduce((sum, s) => sum + s.durationMin, 0)

  // 今日各科目分布
  const subjectMap = new Map<string, number>()
  todaySessions
    .filter((s) => s.startedAt.toISOString().slice(0, 10) === today)
    .forEach((s) => {
      const key = s.subject || '未选科目'
      subjectMap.set(key, (subjectMap.get(key) ?? 0) + s.durationMin)
    })

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-bold text-slate-900">番茄专注</h1>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-6">
        <PomodoroTimer />
      </section>

      {/* 今日统计 */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">今日专注</h2>
        <div className="text-3xl font-bold text-indigo-600">
          {todayMinutes}
          <span className="ml-1 text-sm font-normal text-slate-400">分钟</span>
        </div>
        {subjectMap.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[...subjectMap.entries()].map(([name, mins]) => (
              <span
                key={name}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                {name} {mins} 分钟
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 最近记录 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">最近记录</h2>
        {recentSessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            还没有专注记录,开始第一个番茄吧 🍅
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentSessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">
                  {s.subject || '未选科目'}
                  <span className="ml-2 text-xs text-slate-400">
                    {s.startedAt.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
                <span className="font-medium text-slate-600">{s.durationMin} 分钟</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  )
}
