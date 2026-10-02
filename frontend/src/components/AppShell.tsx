'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookHeart, CalendarHeart, Compass, Gift, Home, LogOut, Map, User, Wand2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApi, useSession } from '../lib/session'
import type { Me, Person } from '../lib/types'
import { Avatar } from './Avatar'
import { Logo } from './ui'
import { PageLoader } from './shared'

export interface CoupleInfo {
  couple: { id: string; since: string; source: string; partner: Person } | null
  invites: { id: string; incoming: boolean; person: { id: string; name: string; avatar: Person['avatar'] } }[]
}

const CoupleCtx = createContext<{ data: CoupleInfo | null; reload: () => Promise<void> }>({ data: null, reload: async () => {} })
export const useCouple = () => useContext(CoupleCtx)

type Item = { href: string; label: string; icon: LucideIcon }

function navFor(user: Me, hasCouple: boolean): { primary: Item[]; more: Item[] } {
  const home = { href: '/app', label: 'Home', icon: Home }
  const discover = { href: '/app/discover', label: 'Discover', icon: Compass }
  const dates = { href: '/app/dates', label: hasCouple ? 'Plans' : 'Dates', icon: CalendarHeart }
  const lab = { href: '/app/date-lab', label: 'Date Lab', icon: Wand2 }
  const memories = { href: '/app/memories', label: 'Memories', icon: BookHeart }
  const experiences = { href: '/app/experiences', label: 'Experiences', icon: Map }
  const surprise = { href: '/app/surprise', label: 'Surprise', icon: Gift }
  const profile = { href: '/app/profile', label: 'Profile', icon: User }
  if (user.mode === 'couple' || hasCouple) return { primary: [home, lab, dates, memories, profile], more: [surprise, experiences] }
  if (user.mode === 'both') return { primary: [home, discover, dates, lab, profile], more: [experiences, memories] }
  return { primary: [home, discover, dates, experiences, profile], more: [] }
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const couple = useApi<CoupleInfo>(user?.role === 'user' ? '/couples/me' : null)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (user.role === 'partner') router.replace('/partner')
    else if (user.role === 'admin') router.replace('/admin')
    else if (!user.onboarded) router.replace('/onboarding')
  }, [user, loading, router, pathname])

  if (loading || !user || user.role !== 'user' || !user.onboarded) return <PageLoader />

  const { primary, more } = navFor(user, !!couple.data?.couple)
  const active = (href: string) => (href === '/app' ? pathname === '/app' : pathname.startsWith(href))
  const accent = user.mode === 'couple' || couple.data?.couple ? 'text-plum bg-plum-soft' : 'text-ember-dark bg-ember-soft'

  return (
    <CoupleCtx.Provider value={{ data: couple.data, reload: couple.reload }}>
      <div className="min-h-screen bg-cream md:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex">
          <Link href="/app" className="px-2"><Logo size="sm" /></Link>
          <nav className="mt-8 flex-1 space-y-1">
            {[...primary, ...more].map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${active(n.href) ? accent : 'text-ink-soft hover:bg-sand'}`}>
                <n.icon size={18} /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 rounded-2xl bg-sand/70 p-3">
            <Avatar config={user.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{user.name}</div>
              <div className="truncate text-[11px] text-muted">{couple.data?.couple ? `with ${couple.data.couple.partner.name}` : user.email}</div>
            </div>
            <button
              aria-label="Log out"
              onClick={async () => {
                await logout()
                router.replace('/')
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white hover:text-ink cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line/60 bg-cream/90 px-4 backdrop-blur md:hidden">
          <Link href="/app"><Logo size="sm" /></Link>
          <Link href="/app/profile" aria-label="Profile"><Avatar config={user.avatar} size={32} /></Link>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-3 bottom-3 z-40 flex rounded-[26px] border border-line/70 bg-white/95 px-1 py-1.5 shadow-lift backdrop-blur-xl md:hidden">
          {primary.map((t) => (
            <Link key={t.href} href={t.href} className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold ${active(t.href) ? (accent.split(' ')[0]) : 'text-muted'}`}>
              <t.icon size={20} strokeWidth={active(t.href) ? 2.4 : 1.8} />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </CoupleCtx.Provider>
  )
}
