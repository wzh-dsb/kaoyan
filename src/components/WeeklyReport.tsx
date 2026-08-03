'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronRight, History } from 'lucide-react'

type ReportRecord = {
  id: string
  weekStart: string
  status: 'pending' | 'done' | 'error'
  report: string | null
  error: string | null
}

type HistoryRecord = { weekStart: string; report: string | null }

/** AI 周报:后台生成(切页不丢)+ 自动轮询 + 历史记录回看 */
export default function WeeklyReport({ initialRemaining = 3 }: { initialRemaining?: number }) {
  const [week, setWeek] = useState<ReportRecord | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true) // 首次加载
  const [generating, setGenerating] = useState(false)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [historyOpen, setHistoryOpen] = useState(false)

  const refresh = useCallback(async () => {
    const [weekRes, historyRes] = await Promise.all([
      fetch('/api/report?scope=week').then((r) => r.json()),
      fetch('/api/report?scope=history').then((r) => r.json()),
    ])
    setWeek(weekRes.record ?? null)
    if (typeof weekRes.remaining === 'number') setRemaining(weekRes.remaining)
    setHistory(historyRes.records ?? [])
    setLoading(false)
  }, [])

  // 首次加载
  useEffect(() => {
    void refresh()
  }, [refresh])

  // pending 时自动轮询(每 3 秒),直到完成;轮询请求会认领并完成生成
  useEffect(() => {
    if (week?.status !== 'pending') return
    const timer = setTimeout(() => void refresh(), 3000)
    return () => clearTimeout(timer)
  }, [week, refresh])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/report', { method: 'POST' })
      const data = await res.json()
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      if (!res.ok) {
        setWeek({ id: '', weekStart: '', status: 'error', report: null, error: data.error ?? '生成失败' })
        return
      }
      setWeek(data.record)
    } catch {
      // 请求被中断(如切换页面):服务端记录保持 pending,回来会自动认领完成
      await refresh()
    } finally {
      setGenerating(false)
    }
  }

  const isGenerating = generating || week?.status === 'pending'

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Sparkles size={15} className="text-violet-500" />
          AI 周报
          <span className="text-xs font-normal text-slate-400">
            {remaining > 0 ? `今日剩余 ${remaining} 次` : '今日次数已用完'}
          </span>
        </div>
        <button
          onClick={generate}
          disabled={isGenerating || remaining <= 0}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {week?.status === 'pending' ? '生成中,可先去别的页面…' : '生成中…'}
            </>
          ) : week?.status === 'done' ? (
            <>
              <RefreshCw size={13} /> 重新生成
            </>
          ) : (
            <>
              <Sparkles size={13} /> 生成周报
            </>
          )}
        </button>
      </div>

      {/* 首次加载 */}
      {loading && <p className="text-xs text-slate-400">加载中…</p>}

      {/* 生成中提示 */}
      {isGenerating && !loading && (
        <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-600">
          <Loader2 size={13} className="animate-spin" />
          周报生成中(约 10~30 秒),你可以先去其他页面,生成结果会自动保存,稍后回来即可查看
        </p>
      )}

      {/* 错误 */}
      {!isGenerating && week?.status === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{week.error}</p>
      )}

      {/* 本周周报内容 */}
      {!loading && week?.status === 'done' && week.report && (
        <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
          {week.report}
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {historyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <History size={13} />
            历史周报({history.length})
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-2">
              {history.map((h) => (
                <li key={h.weekStart} className="rounded-lg border border-slate-100 p-2.5">
                  <div className="mb-1 text-xs font-medium text-slate-400">{h.weekStart} 当周</div>
                  {h.report && (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                      {h.report}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
