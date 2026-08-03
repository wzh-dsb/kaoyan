'use client'

import { useRef, useState } from 'react'
import { Search } from 'lucide-react'

interface SearchSelectProps {
  name: string // 表单提交时的字段名
  options: string[]
  defaultValue?: string
  placeholder?: string
  maxResults?: number
}

/** 搜索下拉选择:输入过滤 + 点击选中,选中值通过 hidden input 随表单提交 */
export default function SearchSelect({
  name,
  options,
  defaultValue = '',
  placeholder = '输入关键字搜索',
  maxResults = 8,
}: SearchSelectProps) {
  const [query, setQuery] = useState(defaultValue)
  const [selected, setSelected] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = query.trim()
  const filtered = q
    ? options.filter((o) => o.includes(q)).slice(0, maxResults)
    : options.slice(0, maxResults)

  const pick = (o: string) => {
    setSelected(o)
    setQuery(o)
    setOpen(false)
  }

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={scheduleClose}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSelected('')
              setOpen(true)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            清除
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={selected} />

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault() // 防止输入框 blur 先触发关闭
                  pick(o)
                }}
                className={`w-full px-3 py-2 text-left text-sm transition hover:bg-indigo-50 ${
                  selected === o ? 'font-medium text-indigo-700' : 'text-slate-700'
                }`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <p className="mt-1 text-xs text-indigo-600">已选择:{selected}</p>
      )}
    </div>
  )
}
