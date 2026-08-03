'use client'

import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { usePomodoro } from '@/lib/pomodoro-context'

const PRESETS = [25, 45, 60]
const SUBJECTS = ['政治', '英语', '数学', '专业课', '其他']
const MIN_CUSTOM = 1
const MAX_CUSTOM = 240 // 与服务端保存上限一致

export default function PomodoroTimer() {
  const {
    minutes,
    remaining,
    running,
    subject,
    done,
    start,
    pause,
    reset,
    pickPreset,
    chooseSubject,
  } = usePomodoro()

  const [customInput, setCustomInput] = useState(String(minutes))

  // 点击预设或应用自定义后,输入框同步显示当前时长
  useEffect(() => {
    setCustomInput(String(minutes))
  }, [minutes])

  const applyCustom = () => {
    const v = Number.parseInt(customInput, 10)
    if (Number.isNaN(v)) return
    pickPreset(Math.min(MAX_CUSTOM, Math.max(MIN_CUSTOM, v)))
  }

  const totalSec = minutes * 60
  const progress = totalSec > 0 ? 1 - remaining / totalSec : 0
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  // 秒数归零即完成(由 Provider 统一标记 done 并保存)
  const finished = remaining === 0 && minutes > 0

  return (
    <div className="flex flex-col items-center">
      {/* 时长预设(计时中禁用,防误触重置) */}
      <div className="mb-6 flex items-center gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => pickPreset(m)}
            disabled={running}
            title={running ? '计时中,请先暂停或重置' : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              minutes === m
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${running ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {m} 分钟
          </button>
        ))}
        {/* 自定义时长 */}
        <div className="ml-1 flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <input
            type="number"
            min={MIN_CUSTOM}
            max={MAX_CUSTOM}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={running}
            title={running ? '计时中,请先暂停或重置' : undefined}
            className={`w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
              running ? 'cursor-not-allowed opacity-50' : ''
            }`}
          />
          <button
            onClick={applyCustom}
            disabled={running}
            title={running ? '计时中,请先暂停或重置' : undefined}
            className={`rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200 ${
              running ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            分钟
          </button>
        </div>
      </div>

      {/* 科目选择 */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-slate-400">专注科目:</span>
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => chooseSubject(s === subject ? '' : s)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              subject === s
                ? 'bg-violet-100 font-medium text-violet-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 环形计时器 */}
      <div className="relative mb-8 h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="88" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke={finished ? '#22c55e' : '#6366f1'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * progress}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {finished ? (
            <>
              <div className="text-3xl">🎉</div>
              <div className="mt-1 text-sm font-medium text-green-600">
                专注完成,记录已保存!
              </div>
              <button
                onClick={start}
                className="mt-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                再来一轮
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl font-bold tabular-nums text-slate-900">
                {mm}:{ss}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {subject || '未选科目'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-4">
        {!running ? (
          <button
            onClick={start}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Play size={18} /> 开始专注
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex items-center gap-2 rounded-full bg-slate-700 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Pause size={18} /> 暂停
          </button>
        )}
        <button
          onClick={reset}
          aria-label="重置"
          className="rounded-full bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  )
}
