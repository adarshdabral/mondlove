'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { LogoMark } from './ui'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: string
}

export function DashboardShell({
  title,
  subtitle,
  badge,
  nav,
  active,
  onNav,
  user,
  children,
  accent = 'ember',
  onLogout,
}: {
  title: string
  subtitle: string
  badge?: ReactNode
  nav: NavItem[]
  active: string
  onNav: (id: string) => void
  user: { name: string; initials: string; role: string }
  children: ReactNode
  accent?: 'ember' | 'plum' | 'ink'
  onLogout?: () => Promise<void>
}) {
  const router = useRouter()
  const activeCls = { ember: 'bg-ember-soft text-ember-dark', plum: 'bg-plum-soft text-plum', ink: 'bg-ink text-white' }[accent]
  return (
    <div className="flex min-h-full bg-[#F7F3EE]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white px-3 py-5 md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <LogoMark size={30} />
          <div>
            <div className="font-display text-[17px] font-semibold leading-none">mingleo</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{accent === 'ink' ? 'Admin console' : 'Partner hub'}</div>
          </div>
        </div>
        <nav className="mt-7 flex-1 space-y-0.5">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => onNav(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition cursor-pointer ${active === n.id ? activeCls : 'text-ink-soft hover:bg-sand'}`}
            >
              <n.icon size={17} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge && <span className="rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-bold text-white">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-2xl bg-sand/70 p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-bold text-white">{user.initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{user.name}</div>
            <div className="truncate text-[11px] text-muted">{user.role}</div>
          </div>
          {onLogout && (
            <button aria-label="Log out" onClick={async () => { await onLogout(); router.replace('/') }} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white hover:text-ink cursor-pointer">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line bg-[#F7F3EE]/90 backdrop-blur">
          <div className="flex items-center gap-4 px-5 py-4 lg:px-8">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-2xl">{title}</h1>
                {badge}
              </div>
              <div className="truncate text-[13px] text-muted">{subtitle}</div>
            </div>
            <Link href="/" className="hidden text-[13px] font-semibold text-muted hover:text-ink sm:block">mingleo.app</Link>
            {onLogout && (
              <button aria-label="Log out" onClick={async () => { await onLogout(); router.replace('/') }} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white md:hidden cursor-pointer"><LogOut size={16} /></button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto px-4 pb-3 no-scrollbar md:hidden">
            {nav.map((n) => (
              <button key={n.id} onClick={() => onNav(n.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${active === n.id ? activeCls : 'bg-white text-ink-soft'}`}>
                <n.icon size={14} /> {n.label}
              </button>
            ))}
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

export function Panel({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line/80 bg-white p-5 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Kpi({ label, value, delta, icon, tone = 'ember', foot }: { label: string; value: string; delta?: string; icon?: ReactNode; tone?: 'ember' | 'plum' | 'sage' | 'gold' | 'sky'; foot?: ReactNode }) {
  const t = { ember: 'bg-ember-soft text-ember-dark', plum: 'bg-plum-soft text-plum', sage: 'bg-sage-soft text-sage', gold: 'bg-gold-soft text-[#9a6d17]', sky: 'bg-sky-soft text-sky' }[tone]
  const neg = delta?.startsWith('-')
  return (
    <div className="rounded-3xl border border-line/80 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-xl ${t}`}>{icon}</span>}
      </div>
      <div className="mt-2 font-display text-[28px] leading-none">{value}</div>
      <div className="mt-2 flex items-center justify-between text-xs">
        {delta && <span className={`font-semibold ${neg ? 'text-red-500' : 'text-sage'}`}>{delta} <span className="font-normal text-muted">vs last month</span></span>}
        {foot}
      </div>
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed: 'bg-sage-soft text-sage',
    Arrived: 'bg-sky-soft text-sky',
    Completed: 'bg-sand text-ink-soft',
    Pending: 'bg-gold-soft text-[#9a6d17]',
    Cancelled: 'bg-red-50 text-red-600',
    Surprise: 'bg-ember-soft text-ember-dark',
    Open: 'bg-gold-soft text-[#9a6d17]',
    'In review': 'bg-sky-soft text-sky',
    Resolved: 'bg-sage-soft text-sage',
    Escalated: 'bg-red-50 text-red-600',
    Active: 'bg-sage-soft text-sage',
    Suspended: 'bg-red-50 text-red-600',
    Verified: 'bg-sage-soft text-sage',
    Paused: 'bg-sand text-muted',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[status] ?? 'bg-sand text-ink-soft'}`}>{status}</span>
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto thin-scroll">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
            {head.map((h) => <th key={h} className="px-5 py-2.5 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0 hover:bg-sand/40">
              {r.map((c, j) => <td key={j} className="whitespace-nowrap px-5 py-3">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
