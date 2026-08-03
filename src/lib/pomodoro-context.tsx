'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { saveFocus } from '@/lib/actions/focus'

const STORAGE_KEY = 'pomodoro-state'

interface PomodoroState {
  minutes: number
  remaining: number // 剩余秒数
  running: boolean
  subject: string
  done: boolean
  saved: boolean // 本次完成是否已写入数据库
}

const DEFAULT_STATE: PomodoroState = {
  minutes: 25,
  remaining: 25 * 60,
  running: false,
  subject: '',
  done: false,
  saved: true,
}

interface PomodoroContextValue extends PomodoroState {
  start: () => void
  pause: () => void
  reset: () => void
  pickPreset: (m: number) => void
  chooseSubject: (s: string) => void
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null)

/** 进程内防重:React StrictMode 开发模式会双挂载,避免补保存执行两次 */
let restoreSaving = false

function loadState(): PomodoroState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const s = JSON.parse(raw) as Partial<PomodoroState> & { savedAt?: number }
    if (!s.running || s.done) return { ...DEFAULT_STATE, ...s }

    // 计时中断(刷新/关闭)后按时间戳恢复流逝的秒数
    const elapsed = Math.floor((Date.now() - (s.savedAt ?? Date.now())) / 1000)
    const remaining = Math.max(0, (s.remaining ?? 0) - elapsed)
    if (remaining === 0) {
      return { ...DEFAULT_STATE, ...s, remaining: 0, running: false, done: true, saved: false }
    }
    return { ...DEFAULT_STATE, ...s, remaining }
  } catch {
    return DEFAULT_STATE
  }
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  // 初始状态必须与服务端一致(DEFAULT_STATE),否则 hydrate 报错;
  // localStorage 里恢复的计时状态在挂载后再加载(刷新页面仍能续时)
  const [state, setState] = useState<PomodoroState>(DEFAULT_STATE)

  useEffect(() => {
    setState(loadState())
  }, [])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const savedRef = useRef(state.saved)

  // 倒计时驱动
  useEffect(() => {
    if (!state.running) return
    intervalRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, remaining: prev.remaining > 1 ? prev.remaining - 1 : 0 }))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.running])

  // 归零 → 标记完成(触发下面的自动保存)
  useEffect(() => {
    if (state.running && state.remaining === 0) {
      setState((prev) => ({ ...prev, running: false, done: true, saved: false }))
    }
  }, [state.running, state.remaining])

  // 状态持久化到 localStorage(刷新/关闭页面后可恢复)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, savedAt: Date.now() }),
      )
    } catch {
      // 隐私模式等场景忽略
    }
  }, [state])

  // 完成且未保存 → 自动写入数据库(仅一次)
  useEffect(() => {
    if (!state.done || state.saved || savedRef.current || restoreSaving) return
    restoreSaving = true
    savedRef.current = true
    const fd = new FormData()
    fd.set('durationMin', String(state.minutes))
    fd.set('subject', state.subject)
    void saveFocus(fd)
      .catch(() => {
        // 保存失败允许重试
        savedRef.current = false
      })
      .finally(() => {
        restoreSaving = false
        setState((prev) => ({ ...prev, saved: true }))
      })
  }, [state.done, state.saved, state.minutes, state.subject])

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.done) {
        // 已完成后重新开始一轮
        return {
          ...prev,
          remaining: prev.minutes * 60,
          running: true,
          done: false,
          saved: true,
        }
      }
      return { ...prev, running: true }
    })
  }, [])

  const pause = useCallback(() => setState((prev) => ({ ...prev, running: false })), [])

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      running: false,
      remaining: prev.minutes * 60,
      done: false,
      saved: true,
    }))
  }, [])

  // 切换时长(预设或自定义)。计时进行中禁止切换,防止误触重置
  const pickPreset = useCallback((m: number) => {
    setState((prev) => {
      if (prev.running) return prev // 计时中:忽略时长切换
      return {
        ...prev,
        minutes: m,
        remaining: m * 60,
        running: false,
        done: false,
        saved: true,
      }
    })
  }, [])

  const chooseSubject = useCallback((s: string) => {
    setState((prev) => ({ ...prev, subject: s }))
  }, [])

  return (
    <PomodoroContext.Provider
      value={{ ...state, start, pause, reset, pickPreset, chooseSubject }}
    >
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error('usePomodoro 必须在 PomodoroProvider 内使用')
  return ctx
}
