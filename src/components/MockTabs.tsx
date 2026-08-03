import Link from 'next/link'

/** 模考区顶部 Tab:记录 | 错题本 */
export default function MockTabs({ active }: { active: 'records' | 'mistakes' }) {
  const tabs = [
    { key: 'records', href: '/mock', label: '模考记录' },
    { key: 'mistakes', href: '/mock/mistakes', label: '错题本' },
  ]
  return (
    <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition ${
            active === t.key
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
