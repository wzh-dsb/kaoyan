import { Download, LogOut } from 'lucide-react'
import AppShell from '@/components/AppShell'
import ProfileForm from '@/components/ProfileForm'
import { requireUser } from '@/lib/auth'
import { logout } from '@/lib/actions/auth'

function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-bold text-slate-900">设置</h1>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">考研信息</h2>
        <ProfileForm
          examDate={user.examDate ? toDateInputValue(user.examDate) : ''}
          targetSchool={user.targetSchool ?? ''}
          targetMajor={user.targetMajor ?? ''}
          nickname={user.nickname ?? ''}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">数据</h2>
        <p className="mb-4 text-sm text-slate-500">
          导出全部学习数据(任务/打卡/专注/模考/错题)为 JSON 文件,用于备份或迁移
        </p>
        <a
          href="/api/export"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
        >
          <Download size={16} /> 导出数据
        </a>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">账号</h2>
        <p className="mb-4 text-sm text-slate-500">
          当前登录:{user.email}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={16} /> 退出登录
          </button>
        </form>
      </section>
    </AppShell>
  )
}
