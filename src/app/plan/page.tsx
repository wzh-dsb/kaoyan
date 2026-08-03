import { Check, Plus, Trash2, X } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDaysStr, diffDays, thisWeekStart, todayStr, weekDays, weekdayName } from '@/lib/date'
import { addPhase, deletePhase } from '@/lib/actions/phases'
import { addTaskOnDate, carryOverTasks, deleteTask, toggleTask } from '@/lib/actions/tasks'

const PHASE_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444']

export default async function PlanPage() {
  const user = await requireUser()
  const today = todayStr()
  const weekStart = thisWeekStart()
  const days = weekDays(weekStart)

  const [phases, weekTasks, lastWeekUndone] = await Promise.all([
    prisma.phase.findMany({ where: { userId: user.id }, orderBy: { sortOrder: 'asc' } }),
    prisma.task.findMany({ where: { userId: user.id, planDate: { in: days } } }),
    prisma.task.count({
      where: {
        userId: user.id,
        planDate: { gte: addDaysStr(weekStart, -7), lt: weekStart },
        done: false,
      },
    }),
  ])

  const doneCount = weekTasks.filter((t) => t.done).length
  const tasksByDay = new Map(days.map((d) => [d, weekTasks.filter((t) => t.planDate === d)]))

  return (
    <AppShell wide>
      <h1 className="mb-5 text-xl font-bold text-slate-900">学习计划</h1>

      {/* 阶段计划 */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">阶段计划</h2>

        {phases.length === 0 ? (
          <p className="mb-4 rounded-xl bg-slate-50 py-4 text-center text-sm text-slate-400">
            还没有阶段计划。把备考分成几个阶段(如:基础期 → 强化期 → 冲刺期),明确每阶段的时间范围
          </p>
        ) : (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {phases.map((p) => {
              const total = diffDays(p.endDate, p.startDate) + 1
              const elapsed = diffDays(today, p.startDate) + 1
              const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
              const active = today >= p.startDate && today <= p.endDate
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${active ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: p.color ?? '#94a3b8' }}
                      />
                      <span className="font-medium text-slate-900">{p.name}</span>
                      {active && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                          进行中
                        </span>
                      )}
                    </div>
                    <form action={deletePhase}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        aria-label="删除阶段"
                        className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {p.startDate} ~ {p.endDate}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: p.color ?? '#6366f1' }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">时间进度 {pct}%</div>
                </div>
              )
            })}
          </div>
        )}

        <form action={addPhase} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-slate-500">阶段名称</label>
            <input
              name="name"
              required
              placeholder="如:强化期"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">开始</label>
            <input
              name="startDate"
              type="date"
              required
              defaultValue={today}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">结束</label>
            <input
              name="endDate"
              type="date"
              required
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5 pb-2">
            {PHASE_COLORS.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="color" value={c} className="peer sr-only" />
                <span
                  className="block h-5 w-5 rounded-full border border-white ring-1 ring-slate-200 transition peer-checked:ring-2 peer-checked:ring-slate-700"
                  style={{ backgroundColor: c }}
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus size={16} /> 添加
          </button>
        </form>
      </section>

      {/* 本周任务 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            本周任务
            <span className="ml-2 text-sm font-normal text-slate-400">
              {weekStart} 起
            </span>
          </h2>
          <span className="text-sm text-slate-500">
            已完成 {doneCount}/{weekTasks.length}
          </span>
        </div>

        {lastWeekUndone > 0 && (
          <form action={carryOverTasks} className="mb-4">
            <input type="hidden" name="fromDate" value={addDaysStr(weekStart, -1)} />
            <button
              type="submit"
              className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 transition hover:bg-amber-100"
            >
              上周还有 {lastWeekUndone} 项未完成,点击顺延到今天 →
            </button>
          </form>
        )}

        <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-7 md:overflow-visible">
          {days.map((d) => {
            const dayTasks = tasksByDay.get(d) ?? []
            const isToday = d === today
            const dayDone = dayTasks.filter((t) => t.done).length
            return (
              <div
                key={d}
                className={`w-[150px] shrink-0 rounded-xl border p-3 md:w-auto md:shrink md:min-w-0 ${
                  isToday ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {weekdayName(d)}
                    </div>
                    <div className="text-xs text-slate-400">{d.slice(5)}</div>
                  </div>
                  {isToday && (
                    <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      今天
                    </span>
                  )}
                </div>

                {dayTasks.length > 0 && (
                  <ul className="mb-2 space-y-1">
                    {dayTasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-1.5">
                        <form action={toggleTask} className="shrink-0">
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            type="submit"
                            aria-label="切换完成"
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                              t.done
                                ? 'border-indigo-500 bg-indigo-500 text-white'
                                : 'border-slate-300 text-transparent'
                            }`}
                          >
                            <Check size={10} />
                          </button>
                        </form>
                        <span
                          className={`min-w-0 flex-1 truncate text-xs ${
                            t.done ? 'text-slate-400 line-through' : 'text-slate-700'
                          }`}
                          title={t.title}
                        >
                          {t.title}
                        </span>
                        <form action={deleteTask} className="shrink-0">
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            type="submit"
                            aria-label="删除"
                            className="rounded p-0.5 text-slate-200 transition hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                {dayDone > 0 && (
                  <div className="mb-2 text-[10px] text-slate-400">{dayDone}/{dayTasks.length} 完成</div>
                )}

                <form action={addTaskOnDate} className="flex gap-1">
                  <input type="hidden" name="planDate" value={d} />
                  <input
                    name="title"
                    required
                    placeholder="+ 任务"
                    className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    aria-label="添加"
                    className="shrink-0 rounded-md bg-slate-100 px-1.5 text-slate-500 transition hover:bg-indigo-100 hover:text-indigo-600"
                  >
                    <Plus size={13} />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
