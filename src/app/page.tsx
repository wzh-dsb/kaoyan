import Link from 'next/link'
import { CalendarDays, Check, Flame, Plus, Timer, Trash2, X } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { daysLeft, todayStr } from '@/lib/date'
import { addTask, deleteTask, toggleTask } from '@/lib/actions/tasks'
import { addHabit, deleteHabit, toggleHabit } from '@/lib/actions/habits'

const SUBJECTS = ['政治', '英语', '数学', '专业课', '其他']

// 常用任务模板:点击即添加
const TASK_TEMPLATES = [
  { title: '背单词', subject: '英语' },
  { title: '真题阅读精读', subject: '英语' },
  { title: '作文模板背诵', subject: '英语' },
  { title: '长难句分析', subject: '英语' },
  { title: '政治选择题刷题', subject: '政治' },
  { title: '政治大题背诵', subject: '政治' },
  { title: '数学刷题', subject: '数学' },
  { title: '数学错题回顾', subject: '数学' },
  { title: '专业课教材精读', subject: '专业课' },
  { title: '专业课真题刷题', subject: '专业课' },
]

// 常用习惯模板:点击即添加
const HABIT_TEMPLATES = ['背单词 100 个', '早起', '跑步 30 分钟', '睡前复盘', '英语听力 30 分钟', '专业课背诵']

export default async function HomePage() {
  const user = await requireUser()
  const today = todayStr()

  const [tasks, habits, habitLogs, focusToday, recentRaw] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, planDate: today },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.habit.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } }),
    prisma.habitLog.findMany({ where: { userId: user.id, date: today } }),
    prisma.focusSession.findMany({ where: { userId: user.id } }),
    // 最近任务(标题去重,用于一键复用)
    prisma.task.findMany({
      where: { userId: user.id, planDate: { lt: today } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  // 最近用过的任务:标题去重,最多 6 条
  const seenTitles = new Set<string>()
  const recentTasks: { title: string; subject: string | null }[] = []
  for (const t of recentRaw) {
    if (!seenTitles.has(t.title)) {
      seenTitles.add(t.title)
      recentTasks.push({ title: t.title, subject: t.subject })
      if (recentTasks.length >= 6) break
    }
  }

  const doneCount = tasks.filter((t) => t.done).length
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
  const focusMinutes = focusToday
    .filter((f) => f.startedAt.toISOString().slice(0, 10) === today)
    .reduce((sum, f) => sum + f.durationMin, 0)
  const days = user.examDate ? daysLeft(user.examDate) : null
  const checkedLogs = new Set(habitLogs.map((l) => l.habitId))

  return (
    <AppShell>
      {/* 倒计时卡 */}
      <section className="mb-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white">
        {days !== null ? (
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-sm text-indigo-100">
                <CalendarDays size={16} />
                {user.examDate?.toLocaleDateString('zh-CN')}
              </div>
              <div className="mt-2 text-5xl font-bold tracking-tight">
                {days}
                <span className="ml-1 text-lg font-normal text-indigo-100">天</span>
              </div>
              <div className="mt-1 text-sm text-indigo-100">
                距考研
                {user.targetSchool
                  ? ` · 目标:${user.targetSchool}${user.targetMajor ? ` ${user.targetMajor}` : ''}`
                  : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{progress}%</div>
              <div className="text-xs text-indigo-200">今日任务完成度</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">欢迎回来,{user.nickname || '考研人'}!</div>
              <div className="mt-1 text-sm text-indigo-100">
                设置你的考研日期,开始今天的作战计划
              </div>
            </div>
            <Link
              href="/settings"
              className="rounded-lg bg-white/20 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30"
            >
              去设置
            </Link>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Timer size={16} className="text-indigo-100" />
            今日已专注
            <span className="font-bold">{focusMinutes}</span> 分钟
          </div>
          <Link href="/focus" className="font-medium text-indigo-100 hover:underline">
            去专注 →
          </Link>
        </div>
      </section>

      {/* 今日任务 */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">今日任务</h2>
          <span className="text-sm text-slate-500">
            {doneCount}/{tasks.length} 已完成
          </span>
        </div>

        {/* 完成度进度条 */}
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <form action={addTask} className="mb-4 flex flex-wrap gap-2">
          <input
            name="title"
            required
            placeholder="添加今日任务,如:英语阅读精读 2 篇"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <select
            name="subject"
            defaultValue=""
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">科目</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus size={16} /> 添加
          </button>
        </form>

        {/* 常用任务模板:点击即加 */}
        <div className="mb-3">
          <div className="mb-1.5 text-xs text-slate-400">常用任务:</div>
          <div className="flex flex-wrap gap-1.5">
            {TASK_TEMPLATES.map((t) => (
              <form key={t.title} action={addTask}>
                <input type="hidden" name="title" value={t.title} />
                <input type="hidden" name="subject" value={t.subject} />
                <button
                  type="submit"
                  title={`添加"${t.title}"`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {t.title}
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* 最近用过的任务:一键复用 */}
        {recentTasks.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 text-xs text-slate-400">最近用过:</div>
            <div className="flex flex-wrap gap-1.5">
              {recentTasks.map((t) => (
                <form key={t.title} action={addTask}>
                  <input type="hidden" name="title" value={t.title} />
                  {t.subject && <input type="hidden" name="subject" value={t.subject} />}
                  <button
                    type="submit"
                    title={`添加"${t.title}"`}
                    className="rounded-full border border-indigo-100 bg-indigo-50/60 px-2.5 py-1 text-xs text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100"
                  >
                    ↻ {t.title}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            今天还没有任务,添加一个开始吧 🚀
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-2.5">
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <button
                    type="submit"
                    aria-label={task.done ? '标记未完成' : '标记完成'}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                      task.done
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-slate-300 text-transparent hover:border-indigo-400'
                    }`}
                  >
                    <Check size={13} />
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      task.done ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.subject && (
                    <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {task.subject} · {task.pomodoros} 🍅
                    </span>
                  )}
                </div>
                <form action={deleteTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <button
                    type="submit"
                    aria-label="删除任务"
                    className="rounded p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 打卡区 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame size={18} className="text-orange-500" />
          <h2 className="text-base font-semibold text-slate-900">今日打卡</h2>
        </div>

        <form action={addHabit} className="mb-4 flex gap-2">
          <input
            name="name"
            required
            placeholder="添加习惯,如:背 100 个单词"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus size={16} /> 添加
          </button>
        </form>

        {/* 常用习惯模板:点击即加 */}
        <div className="mb-3">
          <div className="mb-1.5 text-xs text-slate-400">常用习惯:</div>
          <div className="flex flex-wrap gap-1.5">
            {HABIT_TEMPLATES.map((h) => (
              <form key={h} action={addHabit}>
                <input type="hidden" name="name" value={h} />
                <button
                  type="submit"
                  title={`添加习惯"${h}"`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                >
                  {h}
                </button>
              </form>
            ))}
          </div>
        </div>

        {habits.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            还没有习惯,添加第一个坚持的习惯 💪
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {habits.map((habit) => {
              const done = checkedLogs.has(habit.id)
              return (
                <li key={habit.id} className="flex items-center gap-3 py-2.5">
                  <form action={toggleHabit}>
                    <input type="hidden" name="id" value={habit.id} />
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        done
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {done ? '✓ 已打卡' : '打卡'}
                    </button>
                  </form>
                  <span
                    className={`flex-1 text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                  >
                    {habit.name}
                  </span>
                  <form action={deleteHabit}>
                    <input type="hidden" name="id" value={habit.id} />
                    <button
                      type="submit"
                      aria-label="删除习惯"
                      className="rounded p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <X size={15} />
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
