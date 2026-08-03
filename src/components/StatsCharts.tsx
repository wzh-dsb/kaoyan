'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const INDIGO = '#6366f1'
const SLATE = '#94a3b8'

interface FocusDailyPoint {
  date: string
  label: string
  minutes: number
}

interface CompletionPoint {
  label: string
  pct: number | null
  done: number
  total: number
}

interface MockSeries {
  subject: string
  points: { examDate: string; score: number }[]
}

interface StatsChartsProps {
  focusDaily?: FocusDailyPoint[]
  completionDaily?: CompletionPoint[]
  mockSeries?: MockSeries
}

export default function StatsCharts({ focusDaily, completionDaily, mockSeries }: StatsChartsProps) {
  // 专注时长柱状图
  if (focusDaily) {
    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={focusDaily} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [`${value} 分钟`, '专注']}
              labelFormatter={(l) => `日期:${l}`}
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="minutes" fill={INDIGO} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 任务完成率(条形列表,比柱状图更直观)
  if (completionDaily) {
    return (
      <div className="space-y-1.5">
        {completionDaily.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-8 shrink-0 text-slate-400">{d.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              {d.pct !== null && (
                <div
                  className={`h-full rounded-full ${d.pct >= 80 ? 'bg-emerald-500' : d.pct >= 50 ? 'bg-indigo-500' : 'bg-amber-400'}`}
                  style={{ width: `${d.pct}%` }}
                />
              )}
            </div>
            <span className="w-12 shrink-0 text-right text-slate-500">
              {d.pct !== null ? `${d.pct}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // 模考分数折线
  if (mockSeries) {
    const minScore = Math.min(...mockSeries.points.map((p) => p.score))
    const maxScore = Math.max(...mockSeries.points.map((p) => p.score))
    const pad = Math.max(5, Math.round((maxScore - minScore) * 0.2))
    return (
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockSeries.points} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="examDate" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[Math.max(0, minScore - pad), maxScore + pad]}
              tick={{ fontSize: 10, fill: SLATE }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [String(value), '分数']}
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={INDIGO}
              strokeWidth={2}
              dot={{ r: 3, fill: INDIGO, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
