'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Timer, ClipboardList, CalendarRange, BarChart3, Settings } from 'lucide-react'
import { PomodoroProvider } from '@/lib/pomodoro-context'

const NAV = [
  { href: '/', label: '工作台', icon: LayoutDashboard },
  { href: '/plan', label: '计划', icon: CalendarRange },
  { href: '/focus', label: '专注', icon: Timer },
  { href: '/mock', label: '模考', icon: ClipboardList },
  { href: '/stats', label: '统计', icon: BarChart3 },
  { href: '/settings', label: '设置', icon: Settings },
]

export default function AppShell({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    // 番茄钟状态提升到布局层:路由切换时保持计时,不随页面卸载
    <PomodoroProvider>
      <div className="min-h-screen">
        {/* 桌面侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-48 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col p-4">
          <Link href="/" className="mb-8 text-lg font-bold text-slate-900">
            📚 考研工作台
          </Link>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* 移动端顶部标题 */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center px-4 py-3">
          <Link href="/" className="text-base font-bold text-slate-900">
            📚 考研工作台
          </Link>
        </div>
      </header>

      {/* 内容区 */}
      <main className="pb-24 lg:ml-48 lg:pb-8">
        <div
          className={`mx-auto px-4 pt-5 lg:pt-8 ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
        >
          {children}
        </div>
      </main>

      {/* 移动端底部导航 */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white lg:hidden">
        <div className="flex">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                  active ? 'font-semibold text-indigo-600' : 'text-slate-500'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
      </div>
    </PomodoroProvider>
  )
}
