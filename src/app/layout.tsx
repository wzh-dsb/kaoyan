import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegister from '@/components/PwaRegister'

export const metadata: Metadata = {
  title: '考研工作台',
  description: '考研人的每日任务、计划、专注与模拟分数记录工作台',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
