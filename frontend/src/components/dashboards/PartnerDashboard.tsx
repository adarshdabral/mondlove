'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import { VenueDetails } from '../VenueDetails'
import type { Package as VenuePackage, Venue } from '../../lib/types'
import {
  BarChart3, CalendarCheck, CalendarClock, CheckCircle2, Crown, IndianRupee, LayoutDashboard, Megaphone,
  Package as PackageIcon, Plus, Settings, Star, Tag, Trash2, TrendingUp, Users, Minus,
} from 'lucide-react'
import { DashboardShell, Kpi, Panel, StatusPill, Table, type NavItem } from '../DashboardShell'
import { AreaChart, BarChart, Donut } from '../charts'
import { Button, Chip, Field, Modal, Pill, Toggle, inputCls } from '../ui'
import { api, errorMessage } from '../../lib/api'
import { inr } from '../../lib/constants'
import { useSession, useToast } from '../../lib/session'

type Kind = 'cafe' | 'activity'

interface Pkg {
  id: string
  name: string
  includes: string[]
  price: number
  days: string[]
  capacity: number
  active: boolean
  sold: number
  emoji: string
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const nextMonday = () => {
  const d = new Date()
  d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7))
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
const SOURCE_LABELS: Record<string, string> = { date: 'Date proposals', lab: 'Date Lab', surprise: 'Surprise My Partner', marketplace: 'Marketplace' }

/** Shape of GET /api/partner/dashboard. */
export interface PartnerLive {
  venue: { id: string; status: 'draft' | 'pending' | 'verified' | 'suspended'; kind: 'cafe' | 'restaurant' | 'activity'; name: string; area: string; category: string; plan: string; featured: boolean; rating: number; reviews: number; commissionRate: number; availability: Record<string, number>; slots: string[] }
  reviews: { average: number | null; count: number; tags: { tag: string; pct: number }[]; recent: { rating: number; tags: string[]; experience: string; when: string; guest: string }[] }
  kpis: { bookings30d: number; gross30d: number; upcoming7d: number; rating: number }
  payout: { gross: number; commission: number; giftShare: number; net: number }
  series: { label: string; value: number }[]
  weekday: number[]
  sources: { kind: string; count: number }[]
  topTreats: { name: string; pct: number }[]
  bookings: { id: string; ref: string; guests: string; when: string; experience: string; exchange: string; amount: number; status: string }[]
  packages: (Omit<Pkg, 'emoji'> & { emoji?: string })[]
}
/** Business dashboard for the venue owned by the signed-in partner. All figures come from the API. */
export function PartnerDashboard({ initial }: { initial: PartnerLive }) {
  const kind: Kind = initial.venue.kind === 'activity' ? 'activity' : 'cafe'
  const toast = useToast()
  const { user, logout } = useSession()
  const [live, setLive] = useState<PartnerLive>(initial)
  const [tab, setTab] = useState('dashboard')
  const [pkgs, setPkgs] = useState<Pkg[]>(() => initial.packages.map((p) => ({ ...p, emoji: p.emoji ?? (kind === 'cafe' ? '☕' : '🏺') })))
  const [creating, setCreating] = useState(false)
  const times = initial.venue.slots.length ? initial.venue.slots : ['6:00 PM', '7:30 PM']
  const [grid, setGrid] = useState<Record<string, number>>(() => {
    const g: Record<string, number> = {}
    WEEK.forEach((d) => times.forEach((t) => (g[`${d}-${t}`] = 4)))
    return { ...g, ...initial.venue.availability }
  })
  const [statuses, setStatuses] = useState<Record<string, string>>({})

  /** Calls the API; on failure shows the error and returns null. */
  const sync = useCallback(
    async <T,>(method: 'GET' | 'POST' | 'PATCH' | 'PUT', path: string, body?: unknown): Promise<T | null> => {
      try {
        return await api<T>(path, { method, body })
      } catch (e) {
        toast(errorMessage(e), 'warn')
        return null
      }
    },
    [toast],
  )
  const load = useCallback(async () => {
    const d = await sync<PartnerLive>('GET', '/partner/dashboard')
    if (d) setLive(d)
  }, [sync])
  useEffect(() => {
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  const pendingCount = live.bookings.filter((b) => (statuses[b.ref] ?? b.status) === 'Pending').length
  const nav: NavItem[] = kind === 'cafe'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', label: 'Bookings', icon: CalendarCheck, badge: pendingCount ? String(pendingCount) : undefined },
        { id: 'packages', label: 'Experiences', icon: PackageIcon },
        { id: 'availability', label: 'Availability', icon: CalendarClock },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'listing', label: 'Listing', icon: ImageIcon },
        { id: 'profile', label: 'Profile', icon: Settings },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', label: 'Bookings', icon: CalendarCheck, badge: pendingCount ? String(pendingCount) : undefined },
        { id: 'packages', label: 'Activities', icon: PackageIcon },
        { id: 'availability', label: 'Slots & capacity', icon: CalendarClock },
        { id: 'pricing', label: 'Pricing', icon: Tag },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'listing', label: 'Listing', icon: ImageIcon },
        { id: 'profile', label: 'Profile', icon: Settings },
      ]

  const revenue = live.series.map((x) => x.value)
  const revenueLabels = live.series.map((x) => x.label)
  const gross = live.payout.gross
  const commission = live.payout.commission
  const giftShare = live.payout.giftShare
  const treats: [string, number][] = live.topTreats.map((t) => [t.name, t.pct])
  const rows: (string | number)[][] = live.bookings.map((b) => [b.ref, b.guests, b.when, b.experience, b.exchange, b.amount, b.status, b.id])
  const weekdayCounts = live.weekday
  // Fri + Sat + Sun share of bookings (weekday array is Mon..Sun).
  const weekendShare = Math.round(((weekdayCounts[4] + weekdayCounts[5] + weekdayCounts[6]) / Math.max(1, weekdayCounts.reduce((a, b) => a + b, 0))) * 100)
  const sources = live.sources
  const initials = (user?.name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const setBookingStatus = async (ref: string, id: string | undefined, status: 'arrived' | 'confirmed', label: string) => {
    if (id && !(await sync('PATCH', `/partner/bookings/${id}`, { status }))) return
    setStatuses((x) => ({ ...x, [ref]: status === 'arrived' ? 'Arrived' : 'Confirmed' }))
    toast(label, status === 'confirmed' ? 'success' : 'default')
  }
  const accent = kind === 'cafe' ? '#E8774A' : '#4B3B7A'

  const bookingRows = (limit?: number) =>
    rows.slice(0, limit).map(([ref, guests, when, pkg, extra, amt, st, id]) => {
      const status = statuses[ref as string] ?? (st as string)
      return [
        <span className="font-semibold">{ref}</span>,
        guests,
        when,
        pkg,
        <span className="text-ink-soft">{extra}</span>,
        inr(amt as number),
        <StatusPill status={status} />,
        status === 'Confirmed' || status === 'Surprise' ? (
          <button className="text-[12px] font-semibold text-ember cursor-pointer" onClick={() => setBookingStatus(ref as string, id as string | undefined, 'arrived', `${guests} checked in`)}>Check in</button>
        ) : status === 'Pending' ? (
          <button className="text-[12px] font-semibold text-sage cursor-pointer" onClick={() => setBookingStatus(ref as string, id as string | undefined, 'confirmed', 'Booking accepted')}>Accept</button>
        ) : <span className="text-muted">—</span>,
      ]
    })

  return (
    <DashboardShell
      title={nav.find((n) => n.id === tab)?.label === 'Dashboard' ? live.venue.name : nav.find((n) => n.id === tab)!.label}
      subtitle={`${live.venue.area} · ${live.venue.category} · ${Math.round(live.venue.commissionRate * 100)}% commission`}
      badge={live.venue.status !== 'verified' ? <Pill tone="gold">Pending verification</Pill> : live.venue.plan === 'pro' ? <Pill tone="gold"><Crown size={11} /> Partner Pro</Pill> : undefined}
      onLogout={logout}
      logoutTo="/partners/login"
      nav={nav}
      active={tab}
      onNav={setTab}
      user={{ name: user?.name ?? '', initials, role: 'Owner' }}
      accent={kind === 'cafe' ? 'ember' : 'plum'}
    >
      {live.venue.status !== 'verified' && (
        <div className="mb-5 rounded-3xl border border-gold/40 bg-gold-soft p-5 text-sm">
          <div className="font-semibold">Your venue is being verified</div>
          <p className="mt-1 text-ink-soft">Our team checks licences and seating before {live.venue.name} appears to people on Mingleo, usually within two working days. Meanwhile, set up your packages and availability.</p>
        </div>
      )}
      {tab === 'dashboard' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Kpi label="Bookings (30 days)" value={String(live.kpis.bookings30d)} icon={<CalendarCheck size={16} />} />
            <Kpi label="Gross revenue (30 days)" value={inr(gross)} icon={<IndianRupee size={16} />} tone="sage" />
            <Kpi label="Upcoming dates" value={String(live.kpis.upcoming7d)} icon={<Users size={16} />} tone="plum" foot={<span className="text-muted">next 7 days</span>} />
            <Kpi label="Guest rating" value={live.reviews.average != null ? String(live.reviews.average) : '—'} foot={<span className="text-muted">{live.reviews.count} ratings</span>} icon={<Star size={16} />} tone="gold" />
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Revenue from Mingleo bookings" action={<Pill tone="sage"><TrendingUp size={11} /> Weekends drive {weekendShare}%</Pill>} className="xl:col-span-2">
              <AreaChart data={revenue} labels={revenueLabels} color={accent} format={inr} />
            </Panel>
            <Panel title="Your payout · last 30 days">
              <div className="space-y-3 text-[14px]">
                <div className="flex justify-between"><span className="text-muted">Gross bookings</span><span className="font-semibold">{inr(gross)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Mingleo commission (12%)</span><span className="whitespace-nowrap">−{inr(commission)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Gift & add-on share</span><span className="text-sage">+{inr(giftShare)}</span></div>
                <div className="border-t border-dashed border-line pt-3 flex justify-between"><span className="font-semibold">Net payout</span><span className="font-display text-2xl">{inr(gross - commission + giftShare)}</span></div>
                <div className="rounded-2xl bg-sage-soft p-3 text-[12px] text-sage">Paid every Monday · next payout {nextMonday()}</div>
              </div>
            </Panel>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Upcoming dates" action={<button onClick={() => setTab('bookings')} className="text-[13px] font-semibold text-ember cursor-pointer">View all</button>} className="xl:col-span-2">
              <Table head={['Ref', 'Guests', 'When', 'Experience', kind === 'cafe' ? 'Treat exchange' : 'Source', 'Amount', 'Status', '']} rows={bookingRows(4)} />
            </Panel>
            <div className="space-y-5">
              <Panel title={kind === 'cafe' ? 'Most-picked Date Tokens' : 'Most-booked'}>
                <div className="space-y-3">
                  {treats.map(([t, v]) => (
                    <div key={t as string}>
                      <div className="mb-1 flex justify-between text-[13px]"><span>{t}</span><span className="font-semibold">{v}%</span></div>
                      <div className="h-2 rounded-full bg-sand"><div className="h-full rounded-full" style={{ width: `${v}%`, background: accent }} /></div>
                    </div>
                  ))}
                </div>
                {kind === 'cafe' && treats[0] && <div className="mt-3 text-[12px] text-muted">Prep tip: {treats[0][0].replace(/^\S+\s/, '')} is the most-picked Date Token, so stock up before the weekend.</div>}
              </Panel>
              <div className="rounded-3xl bg-ink p-5 text-white">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-peach"><Megaphone size={13} /> Featured placement</div>
                <div className="mt-2 font-display text-xl leading-snug">Appear first in Date Lab for {kind === 'cafe' ? 'coffee' : 'creative'} dates.</div>
                <div className="mt-1 text-[13px] text-white/60">From ₹1,499 a week.</div>
                <a href={`mailto:partners@mingleo.app?subject=${encodeURIComponent(`Featured placement for ${live.venue.name}`)}`} className="mt-4 inline-flex h-9 items-center rounded-full bg-ember px-4 text-[13px] font-semibold text-white">Talk to our partner team</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <Panel title="All bookings" action={<div className="flex gap-1.5">{['All', 'Today', 'Upcoming', 'Completed'].map((f, i) => <Chip key={f} size="sm" tone="ink" active={i === 0}>{f}</Chip>)}</div>} className="animate-fade-in">
          <Table head={['Ref', 'Guests', 'When', 'Experience', kind === 'cafe' ? 'Treat exchange' : 'Source', 'Amount', 'Status', '']} rows={bookingRows()} />
          <p className="mt-4 text-[12px] text-muted">Guests appear by first name only. Contact details are shared on the day of the booking for privacy.</p>
        </Panel>
      )}

      {tab === 'packages' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-soft">Packages appear on date proposals, Date Lab and the Experience marketplace.</p>
            <Button icon={<Plus size={16} />} variant={kind === 'cafe' ? 'primary' : 'plum'} onClick={() => setCreating(true)}>Create Date Package</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pkgs.map((p) => (
              <div key={p.id} className={`rounded-3xl border bg-white p-5 shadow-card ${p.active ? 'border-line' : 'border-dashed border-line opacity-70'}`}>
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-2xl">{p.emoji}</span>
                  <div className="flex items-center gap-2 text-[12px] text-muted">{p.active ? 'Live' : 'Paused'} <Toggle on={p.active} onChange={async (v) => {
                    if (!(await sync('PATCH', `/partner/experiences/${p.id}`, { active: v }))) return
                    setPkgs(pkgs.map((x) => (x.id === p.id ? { ...x, active: v } : x)))
                  }} /></div>
                </div>
                <div className="mt-3 font-display text-xl">{p.name}</div>
                <ul className="mt-2 space-y-0.5 text-[13px] text-ink-soft">{p.includes.map((i) => <li key={i}>· {i}</li>)}</ul>
                <div className="mt-4 flex flex-wrap gap-1">{WEEK.map((d) => <span key={d} className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${p.days.includes(d) ? 'bg-ink text-white' : 'bg-sand text-muted'}`}>{d}</span>)}</div>
                <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
                  <div>
                    <div className="font-display text-2xl">{inr(p.price)}</div>
                    <div className="text-[11px] text-muted">for two · {p.capacity} per slot</div>
                  </div>
                  <div className="text-right text-[12px]"><div className="font-semibold">{p.sold}</div><div className="text-muted">booked</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'availability' && (
        <div className="space-y-5 animate-fade-in">
          <Panel title={kind === 'cafe' ? 'Couple tables per slot' : 'Couples per session'} action={<span className="text-[12px] text-muted">Click a cell to change capacity · 0 = closed</span>}>
            <div className="-mx-5 overflow-x-auto px-5 thin-scroll">
              <div className="grid min-w-[620px] gap-1.5" style={{ gridTemplateColumns: `90px repeat(7, 1fr)` }}>
                <div />
                {WEEK.map((d) => <div key={d} className="text-center text-[12px] font-semibold text-muted">{d}</div>)}
                {times.map((t) => (
                  <div key={t} className="contents">
                    <div className="flex items-center text-[12px] font-semibold text-ink-soft">{t}</div>
                    {WEEK.map((d) => {
                      const k = `${d}-${t}`
                      const v = grid[k]
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            const next = { ...grid, [k]: (v + 1) % 7 }
                            setGrid(next)
                            void sync('PUT', '/partner/availability', next)
                          }}
                          className="h-12 rounded-xl text-[13px] font-semibold transition cursor-pointer hover:ring-2 hover:ring-ink/10"
                          style={{ background: v ? `color-mix(in srgb, ${accent} ${12 + v * 12}%, white)` : '#F4EDE4', color: v > 3 ? '#fff' : v ? '#1E1B2E' : '#8A8499' }}
                        >
                          {v || '—'}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          {kind === 'activity' && (
            <Panel title="This week's sessions">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[['Fri 9 Oct', '6:30 PM', 5, 6], ['Sat 10 Oct', '11:00 AM', 3, 6], ['Sat 10 Oct', '6:30 PM', 6, 6], ['Sun 11 Oct', '4:00 PM', 2, 6], ['Sun 11 Oct', '6:30 PM', 4, 6]].map(([d, t, b, c]) => (
                  <div key={`${d}${t}`} className="rounded-2xl border border-line p-4">
                    <div className="flex justify-between text-[13px]"><span className="font-semibold">{d} · {t}</span>{b === c ? <StatusPill status="Confirmed" /> : <span className="text-muted">{(c as number) - (b as number)} left</span>}</div>
                    <div className="mt-3 h-2 rounded-full bg-sand"><div className="h-full rounded-full bg-plum" style={{ width: `${((b as number) / (c as number)) * 100}%` }} /></div>
                    <div className="mt-2 text-[12px] text-muted">{b}/{c} couples booked</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          <Panel title="Blackout dates">
            <div className="flex flex-wrap gap-2">
              <Chip active tone="ink">Diwali · 20 Oct</Chip>
              <Chip active tone="ink">Staff training · 3 Nov</Chip>
              <Chip onClick={() => toast('Pick a date to block')}>+ Add date</Chip>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'pricing' && (
        <div className="grid gap-5 animate-fade-in xl:grid-cols-2">
          <Panel title="Price per couple" className="xl:col-span-2">
            <Table head={['Activity', 'Weekday', 'Weekend', 'Mingleo fee']} rows={pkgs.map((p) => [p.name, inr(p.price), inr(Math.round(p.price * 1.15)), '12%'])} />
          </Panel>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="grid gap-5 animate-fade-in xl:grid-cols-3">
          <Panel title="Guest rating">
            <div className="font-display text-6xl">{live.reviews.average ?? '—'}</div>
            <div className="mt-1 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} className={i < Math.round(live.reviews.average ?? 0) ? 'fill-gold text-gold' : 'text-line'} />)}</div>
            <div className="mt-2 text-[13px] text-muted">From {live.reviews.count} private post-date ratings</div>
            <div className="mt-4 space-y-2">
              {live.reviews.tags.map((t) => (
                <div key={t.tag}><div className="flex justify-between text-[12px]"><span>{t.tag}</span><span>{t.pct}%</span></div><div className="h-1.5 rounded-full bg-sand"><div className="h-full rounded-full bg-gold" style={{ width: `${t.pct}%` }} /></div></div>
              ))}
            </div>
          </Panel>
          <div className="space-y-3 xl:col-span-2">
            {live.reviews.recent.length === 0 && <Panel><p className="text-sm text-muted">No ratings yet. Guests rate their date privately after it happens.</p></Panel>}
            {live.reviews.recent.map((r, i) => (
              <Panel key={i}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.guest} <span className="font-normal text-muted">· {r.experience}</span></div>
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} className={k < r.rating ? 'fill-gold text-gold' : 'text-line'} />)}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">{r.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
                <div className="mt-2 text-[12px] text-muted">{new Date(r.when).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid gap-5 animate-fade-in xl:grid-cols-2">
          <Panel title="Bookings by day of week"><BarChart data={live.weekday} labels={WEEK} highlight={5} color={kind === 'cafe' ? 'bg-ember' : 'bg-plum'} /></Panel>
          <Panel title="Where your bookings come from">
            <Donut parts={sources.map((x, i) => ({ label: SOURCE_LABELS[x.kind] ?? x.kind, value: Math.max(x.count, 0.01), color: ['#E8774A', '#4B3B7A', '#D9A23B', '#4F8A6A'][i % 4] }))} />
          </Panel>
          <Panel title="Bookings by source (30 days)" className="xl:col-span-2">
            <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
              {sources.map((x) => <div key={x.kind} className="rounded-2xl bg-sand/70 p-3"><div className="font-display text-2xl">{x.count}</div><div className="text-[11px] text-muted">{SOURCE_LABELS[x.kind] ?? x.kind}</div></div>)}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'listing' && <ListingTab />}

      {tab === 'profile' && (
        <div className="grid gap-5 animate-fade-in xl:grid-cols-2">
          <Panel title="Venue">
            <div className="space-y-2 text-[14px]">
              {[['Name', live.venue.name], ['Type', live.venue.kind], ['Category', live.venue.category], ['Area', live.venue.area], ['Daily slots', live.venue.slots.join(', ') || '—'], ['Commission', `${Math.round(live.venue.commissionRate * 100)}% per booking`]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line/60 py-2 last:border-0"><span className="text-muted">{k}</span><span className="font-medium capitalize">{v}</span></div>
              ))}
            </div>
            <a href="mailto:partners@mingleo.app" className="mt-4 inline-block text-sm font-semibold text-ember">Request a change →</a>
          </Panel>
          <Panel title="Verification & plan">
            <div className="space-y-3 text-[14px]">
              <div className="flex items-center gap-2"><CheckCircle2 size={17} className={live.venue.status === 'verified' ? 'text-sage' : 'text-line'} /> {live.venue.status === 'verified' ? 'Verified by Mingleo' : 'Verification in progress'}</div>
              <div className="mt-4 rounded-2xl bg-gold-soft p-4">
                <div className="flex items-center gap-2 font-semibold"><Crown size={16} /> {live.venue.plan === 'pro' ? 'You\u2019re on Partner Pro' : 'Partner Pro · ₹799/mo'}</div>
                <div className="mt-1 text-[12px] text-ink-soft">Advanced analytics, Date Token insights, priority Date Lab ranking and dynamic pricing.</div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <CreatePackage open={creating} onClose={() => setCreating(false)} kind={kind} onSave={async (p) => {
        const r = await sync<{ package: Pkg }>('POST', '/partner/experiences', { name: p.name, includes: p.includes, price: p.price, days: p.days, capacity: p.capacity, emoji: p.emoji })
        if (!r) return
        p = { ...r.package, emoji: p.emoji }
        setPkgs([...pkgs, p])
        setCreating(false)
        toast('Package is live on Mingleo 🎉', 'success')
      }} />
    </DashboardShell>
  )
}

function CreatePackage({ open, onClose, onSave, kind }: { open: boolean; onClose: () => void; onSave: (p: Pkg) => void; kind: Kind }) {
  const [name, setName] = useState(kind === 'cafe' ? 'Sunset Coffee Date' : 'Beginner Wheel Date')
  const [items, setItems] = useState<string[]>(kind === 'cafe' ? ['2 Cappuccinos', '1 Dessert', 'Reserved couple table'] : ['90-min guided class', 'Clay & tools'])
  const [item, setItem] = useState('')
  const [price, setPrice] = useState(kind === 'cafe' ? 720 : 2400)
  const [days, setDays] = useState(['Fri', 'Sat', 'Sun'])
  const [cap, setCap] = useState(4)
  return (
    <Modal open={open} onClose={onClose} title="Create Date Package" wide>
      <div className="grid gap-5 md:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <Field label="Package name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Includes" group>
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-sand/70 px-3 py-2 text-sm">
                  <span className="flex-1">{i}</span>
                  <button onClick={() => setItems(items.filter((x) => x !== i))} aria-label="Remove" className="cursor-pointer text-muted"><Trash2 size={14} /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className={inputCls} placeholder="Add an item" value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && item) { setItems([...items, item]); setItem('') } }} />
                <Button variant="soft" onClick={() => { if (item) { setItems([...items, item]); setItem('') } }}><Plus size={16} /></Button>
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price for two (₹)"><input type="number" className={inputCls} value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
            <Field label="Capacity per slot" group>
              <div className="flex h-[50px] items-center justify-between rounded-2xl border border-line px-2">
                <button onClick={() => setCap(Math.max(1, cap - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-sand cursor-pointer"><Minus size={14} /></button>
                <span className="font-semibold">{cap}</span>
                <button onClick={() => setCap(cap + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-sand cursor-pointer"><Plus size={14} /></button>
              </div>
            </Field>
          </div>
          <Field label="Available on" group>
            <div className="flex flex-wrap gap-1.5">{WEEK.map((d) => <Chip key={d} size="sm" tone="ink" active={days.includes(d)} onClick={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}>{d}</Chip>)}</div>
          </Field>
        </div>
        <div>
          <div className="text-[12px] font-semibold text-muted">Preview on Mingleo</div>
          <div className="mt-2 overflow-hidden rounded-3xl border border-line shadow-card">
            <div className="grid h-24 place-items-center bg-gradient-to-br from-peach to-ember text-4xl">{kind === 'cafe' ? '☕' : '🏺'}</div>
            <div className="p-4">
              <div className="font-semibold">{name || 'Untitled'}</div>
              <div className="mt-1 text-[12px] text-muted">{items.join(' · ')}</div>
              <div className="mt-2 text-[13px] font-semibold">{inr(price)} <span className="font-normal text-muted">for two</span></div>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-sand/70 p-3 text-[12px] text-ink-soft">
            You receive <b>{inr(Math.round(price * 0.88))}</b> per booking after Mingleo&apos;s 12% commission.
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!name || !items.length} onClick={() => onSave({ id: Math.random().toString(36), name, includes: items, price, days, capacity: cap, active: true, sold: 0, emoji: kind === 'cafe' ? '☕' : '🏺' })}>Publish package</Button>
      </div>
    </Modal>
  )
}

/** What guests see, straight from the saved listing, with a way back into the wizard. */
function ListingTab() {
  const [data, setData] = useState<{ venue: Venue & { status: string }; packages: VenuePackage[]; missing: string[] } | null>(null)
  useEffect(() => {
    api<{ venue: Venue & { status: string }; packages: VenuePackage[]; missing: string[] }>('/partner/venue').then(setData).catch(() => {})
  }, [])
  if (!data) return <Panel><p className="text-sm text-muted">Loading your listing…</p></Panel>
  const v = { ...data.venue, packages: data.packages, rating: 0, reviews: 0, verified: data.venue.status === 'verified', emoji: '☕', tone: ['#FBEFD3', '#D9A23B'] as [string, string] }
  return (
    <div className="grid gap-5 animate-fade-in xl:grid-cols-[1fr_320px]">
      <Panel title="What guests see before booking">
        <VenueDetails venue={v} />
      </Panel>
      <div className="space-y-4">
        <Panel title="Listing">
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between"><span className="text-muted">Photos</span><span className="font-semibold">{v.photos?.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted">Menu items</span><span className="font-semibold">{v.treats.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">With photos</span><span className="font-semibold">{v.treats.filter((t) => t.photo).length}</span></div>
            <div className="flex justify-between"><span className="text-muted">Packages</span><span className="font-semibold">{data.packages.length}</span></div>
          </div>
          {data.missing.length > 0 && <p className="mt-3 rounded-2xl bg-gold-soft p-3 text-[12px]">Still missing: {data.missing.join(', ')}</p>}
          <Link href="/partner/setup" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">Edit listing</Link>
        </Panel>
        <p className="px-1 text-[12px] text-muted">Tip: 5 or more photos, and a photo on every menu item, help people picture the date and choose your venue.</p>
      </div>
    </div>
  )
}
