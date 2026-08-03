import AppShell from '@/components/AppShell'
import StatsCharts from '@/components/StatsCharts'
import WeeklyReport from '@/components/WeeklyReport'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDaysStr, thisWeekStart, todayStr } from '@/lib/date'
import { getAiRemaining } from '@/lib/ai-usage'

// 东八区日期键(UTC 时间戳 → 'YYYY-MM-DD')
const shanghaiKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export default async function StatsPage() {
  const user = await requireUser()
  const today = todayStr()

  const DAYS_14 = 14
  const DAYS_90 = 90

  const since14 = addDaysStr(today, -(DAYS_14 - 1))
  const since90 = addDaysStr(today, -(DAYS_90 - 1))
  const weekStart = thisWeekStart()
  const prevWeekStart = addDaysStr(weekStart, -7)

  const [focusSessions, mockExams, tasks, habits, habitLogs, weekFocus, prevFocus, weekTasks, prevTasks, weekLogs, prevLogs] =
    await Promise.all([
      prisma.focusSession.findMany({
        where: { userId: user.id, startedAt: { gte: new Date(since14 + 'T00:00:00+08:00') } },
      }),
      prisma.mockExam.findMany({
        where: { userId: user.id },
        orderBy: { examDate: 'asc' },
      }),
      prisma.task.findMany({
        where: { userId: user.id, planDate: { gte: since14 } },
      }),
      prisma.habit.findMany({ where: { userId: user.id } }),
      prisma.habitLog.findMany({
        where: { userId: user.id, date: { gte: since90 } },
      }),
      // 周报:本周 / 上周专注
      prisma.focusSession.findMany({
        where: { userId: user.id, startedAt: { gte: new Date(weekStart + 'T00:00:00+08:00') } },
      }),
      prisma.focusSession.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: new Date(prevWeekStart + 'T00:00:00+08:00'), lt: new Date(weekStart + 'T00:00:00+08:00') },
        },
      }),
      // 周报:本周 / 上周任务
      prisma.task.findMany({
        where: { userId: user.id, planDate: { gte: weekStart } },
      }),
      prisma.task.findMany({
        where: { userId: user.id, planDate: { gte: prevWeekStart, lt: weekStart } },
      }),
      // 周报:本周 / 上周打卡
      prisma.habitLog.findMany({
        where: { userId: user.id, date: { gte: weekStart } },
      }),
      prisma.habitLog.findMany({
        where: { userId: user.id, date: { gte: prevWeekStart, lt: weekStart } },
      }),
    ])

  // —— 本周概览(周报)——
  const weekFocusMin = weekFocus.reduce((s, f) => s + f.durationMin, 0)
  const prevFocusMin = prevFocus.reduce((s, f) => s + f.durationMin, 0)
  const focusDelta =
    prevFocusMin > 0 ? Math.round(((weekFocusMin - prevFocusMin) / prevFocusMin) * 100) : null

  const weekDone = weekTasks.filter((t) => t.done).length
  const weekRate = weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : null
  const prevDone = prevTasks.filter((t) => t.done).length
  const prevRate = prevTasks.length > 0 ? Math.round((prevDone / prevTasks.length) * 100) : null
  const rateDelta = weekRate !== null && prevRate !== null ? weekRate - prevRate : null

  const weekLogDays = new Set(weekLogs.map((l) => l.date)).size
  const prevLogDays = new Set(prevLogs.map((l) => l.date)).size
  const logDelta = weekLogDays - prevLogDays

  const weekExams = mockExams.filter((e) => e.examDate >= weekStart)
  const weekExamAvg =
    weekExams.length > 0 ? Math.round(weekExams.reduce((s, e) => s + e.score, 0) / weekExams.length) : null

  // AI 周报今日剩余次数
  const reportRemaining = await getAiRemaining(user.id, 'report')

  // 近 14 天每日专注分钟
  const focusByDay = new Map<string, number>()
  focusSessions.forEach((s) => {
    const key = shanghaiKey.format(s.startedAt)
    focusByDay.set(key, (focusByDay.get(key) ?? 0) + s.durationMin)
  })
  const focusDaily = Array.from({ length: DAYS_14 }, (_, i) => {
    const d = addDaysStr(since14, i)
    return { date: d, label: d.slice(5), minutes: focusByDay.get(d) ?? 0 }
  })

  // 近 14 天每日任务完成率
  const tasksByDay = new Map<string, { done: number; total: number }>()
  tasks.forEach((t) => {
    const cur = tasksByDay.get(t.planDate) ?? { done: 0, total: 0 }
    cur.total += 1
    if (t.done) cur.done += 1
    tasksByDay.set(t.planDate, cur)
  })
  const completionDaily = focusDaily.map(({ date, label }) => {
    const cur = tasksByDay.get(date)
    return {
      label,
      pct: cur && cur.total > 0 ? Math.round((cur.done / cur.total) * 100) : null,
      done: cur?.done ?? 0,
      total: cur?.total ?? 0,
    }
  })

  // 模考分数趋势:按科目分组
  const subjectOrder = ['政治', '英语', '数学', '专业课']
  const mockSeries = subjectOrder
    .map((subject) => ({
      subject,
      points: mockExams
        .filter((e) => e.subject === subject)
        .map((e) => ({ examDate: e.examDate.slice(5), score: e.score })),
    }))
    .filter((s) => s.points.length > 0)

  // 打卡热力图:近 90 天,按天计数
  const logCountByDay = new Map<string, number>()
  habitLogs.forEach((l) => logCountByDay.set(l.date, (logCountByDay.get(l.date) ?? 0) + 1))
  const heatCells = Array.from({ length: DAYS_90 }, (_, i) => {
    const d = addDaysStr(since90, i)
    return { date: d, count: logCountByDay.get(d) ?? 0 }
  })

  const renderDelta = (delta: number | null) => {
    if (delta === null) return <span className="text-xs text-slate-400">—</span>
    const up = delta > 0
    const same = delta === 0
    return (
      <span
        className={`text-xs font-medium ${same ? 'text-slate-400' : up ? 'text-emerald-600' : 'text-red-500'}`}
      >
        {up ? '↑' : same ? '→' : '↓'} {Math.abs(delta)}
        {Math.abs(delta) <= 100 ? '%' : ' 点'}
      </span>
    )
  }

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-bold text-slate-900">数据统计</h1>

      {/* 本周概览(周报) */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-slate-900">本周概览</h2>
          <span className="text-xs text-slate-400">
            {weekStart} 起 · 环比上周
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-indigo-50 p-3">
            <div className="text-xs text-indigo-500">专注时长</div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900">
              {weekFocusMin}
              <span className="ml-0.5 text-xs font-normal text-slate-400">分钟</span>
            </div>
            <div className="mt-1">{renderDelta(focusDelta)}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="text-xs text-emerald-600">任务完成率</div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900">
              {weekRate ?? '—'}
              {weekRate !== null && <span className="ml-0.5 text-xs font-normal text-slate-400">%</span>}
            </div>
            <div className="mt-1">{renderDelta(rateDelta)}</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <div className="text-xs text-amber-600">打卡天数</div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900">
              {weekLogDays}
              <span className="ml-0.5 text-xs font-normal text-slate-400">天</span>
            </div>
            <div className="mt-1">{renderDelta(logDelta)}</div>
          </div>
          <div className="rounded-xl bg-sky-50 p-3">
            <div className="text-xs text-sky-600">模考</div>
            <div className="mt-0.5 text-2xl font-bold text-slate-900">
              {weekExams.length}
              <span className="ml-0.5 text-xs font-normal text-slate-400">次</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {weekExamAvg !== null ? `均分 ${weekExamAvg}` : '本周暂无'}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          {weekRate === null
            ? '本周还没有任务数据,开始记录每一天吧'
            : weekRate >= 80
              ? '完成率很稳,继续保持这个节奏 💪'
              : weekRate >= 50
                ? '任务完成过半,明天把剩余的安排上'
                : '这周有点拖,可以从最小的一件任务重新开始'}
        </p>
        <WeeklyReport initialRemaining={reportRemaining} />
      </section>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          专注时长 <span className="ml-1 text-xs font-normal text-slate-400">近 14 天</span>
        </h2>
        <StatsCharts focusDaily={focusDaily} />
      </section>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          任务完成率 <span className="ml-1 text-xs font-normal text-slate-400">近 14 天</span>
        </h2>
        <StatsCharts completionDaily={completionDaily} />
      </section>

      {mockSeries.length > 0 && (
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">模考分数趋势</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockSeries.map((s) => (
              <div key={s.subject}>
                <h3 className="mb-2 text-sm font-medium text-slate-600">{s.subject}</h3>
                <StatsCharts mockSeries={s} />
              </div>
            ))}
          </div>
        </section>
      )}

      {habits.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            打卡热力图 <span className="ml-1 text-xs font-normal text-slate-400">近 90 天 · 颜色越深打卡越多</span>
          </h2>
          {/* GitHub 风格:每列一周 */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {Array.from({ length: 13 }, (_, w) => {
              const startIdx = w * 7
              const cells = heatCells.slice(startIdx, startIdx + 7)
              return (
                <div key={w} className="flex flex-col gap-1">
                  {cells.map((c) => (
                    <div
                      key={c.date}
                      title={`${c.date} · ${c.count} 次打卡`}
                      className={`h-3.5 w-3.5 rounded-[3px] ${
                        c.count === 0
                          ? 'bg-slate-100'
                          : c.count <= 2
                            ? 'bg-emerald-200'
                            : c.count <= 4
                              ? 'bg-emerald-400'
                              : 'bg-emerald-600'
                      }`}
                    />
                  ))}
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">累计打卡习惯数:{habits.length}</p>
        </section>
      )}
    </AppShell>
  )
}
