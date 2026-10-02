'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertTriangle, Ban, CalendarCheck, Check, CreditCard, Flag, Gavel, HeartHandshake, LayoutDashboard, ShieldAlert, Store, UserCheck, Users, X } from 'lucide-react'
import { DashboardShell, Kpi, Panel, StatusPill, Table, type NavItem } from '../DashboardShell'
import { AreaChart, BarChart, Donut, Funnel } from '../charts'
import { Avatar } from '../Avatar'
import { Button, Chip, Modal, Pill } from '../ui'
import { VenueDetails } from '../VenueDetails'
import { PageLoader } from '../shared'
import { api, errorMessage } from '../../lib/api'
import { inr } from '../../lib/constants'
import { useSession, useToast } from '../../lib/session'
import type { AvatarConfig, Package, Venue } from '../../lib/types'

const num = (n: number) => n.toLocaleString('en-IN')
const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`
}

const STREAMS = [
  { id: 'booking_commission', label: 'Booking commission', model: '12% of venue bookings', color: '#E8774A' },
  { id: 'experience_commission', label: 'Experience commission', model: 'Date Lab & surprise bundles', color: '#C95E33' },
  { id: 'subscription', label: 'Mingleo Plus', model: '₹99 per month, optional', color: '#4B3B7A' },
  { id: 'couple_pass', label: 'Couple Pass', model: '₹149 per month', color: '#8C6BB0' },
  { id: 'featured_placement', label: 'Featured placement', model: 'Weekly boosts', color: '#D9A23B' },
  { id: 'partner_pro', label: 'Partner Pro', model: '₹799 per month', color: '#4F7FBF' },
  { id: 'gifts_addons', label: 'Gifts & add-ons', model: '20% of flowers, cakes, décor', color: '#4F8A6A' },
  { id: 'brand_partnership', label: 'Brand partnerships', model: 'Sponsored experiences', color: '#8A8499' },
]

interface Overview {
  kpis: { users: number; couples: number; bookings30d: number; gmv30d: number; revenue30d: number }
  funnel: { label: string; value: number }[]
  streams: Record<string, number>
  safety: { openReports: number; resolvedReports: number; verifiedPct: number; incidentPct: number }
  topVenues: { name: string; count: number }[]
  weekly: { label: string; gmv: number }[]
}
interface Report { id: string; type: string; against: string; by: string; severity: string; status: string; automated: boolean; createdAt: string }
interface UserRow { id: string; name: string; age: number; area: string; mode: string; verified: boolean; status: string; dates: number; reports: number; avatar: AvatarConfig }
interface VenueRow { id: string; name: string; kind: string; area: string; documents: string[]; status: string; plan: string; featured: boolean }
interface BookingRow { id: string; ref: string; kind: string; venue: string; when: string; guests: string; gmv: number; commission: number; status: string }

export function AdminDashboard() {
  const toast = useToast()
  const { user, logout } = useSession()
  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [queue, setQueue] = useState<{ id: string; name: string; method?: string; score?: number; avatar: AvatarConfig }[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [venues, setVenues] = useState<VenueRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [blocks, setBlocks] = useState<{ total: number; perDay: { _id: number; n: number }[] } | null>(null)
  const [filter, setFilter] = useState<'All' | 'Open' | 'High'>('All')
  const [review, setReview] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [o, r, v, u, ven, b, bl] = await Promise.all([
        api<Overview>('/admin/overview'),
        api<{ reports: Report[] }>('/admin/reports'),
        api<{ queue: typeof queue }>('/admin/verifications'),
        api<{ users: UserRow[] }>('/admin/users'),
        api<{ venues: VenueRow[] }>('/admin/venues'),
        api<{ bookings: BookingRow[] }>('/admin/bookings'),
        api<{ total: number; perDay: { _id: number; n: number }[] }>('/admin/blocks/stats'),
      ])
      setOverview(o)
      setReports(r.reports)
      setQueue(v.queue)
      setUsers(u.users)
      setVenues(ven.venues)
      setBookings(b.bookings)
      setBlocks(bl)
    } catch (e) {
      toast(errorMessage(e), 'warn')
    }
  }, [toast])
  useEffect(() => {
    void load()
  }, [load])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast(ok, 'success')
      await load()
    } catch (e) {
      toast(errorMessage(e), 'warn')
    }
  }

  if (!overview) return <PageLoader label="Loading platform data…" />
  const flags = reports.filter((r) => r.automated && r.status !== 'Resolved')
  const humanReports = reports.filter((r) => !r.automated).filter((r) => (filter === 'Open' ? r.status !== 'Resolved' : filter === 'High' ? r.severity === 'High' : true))
  const pendingVenues = venues.filter((v) => v.status === 'pending')
  const openCount = reports.filter((r) => r.status !== 'Resolved').length

  const NAV: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'safety', label: 'Safety & trust', icon: ShieldAlert, badge: queue.length + flags.length ? String(queue.length + flags.length) : undefined },
    { id: 'reports', label: 'Reports', icon: Flag, badge: openCount ? String(openCount) : undefined },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'venues', label: 'Venues', icon: Store, badge: pendingVenues.length ? String(pendingVenues.length) : undefined },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'revenue', label: 'Revenue', icon: CreditCard },
  ]
  const totalRevenue = Object.values(overview.streams).reduce((a, b) => a + b, 0) || 1
  const initials = (user?.name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <DashboardShell
      title={NAV.find((n) => n.id === tab)!.label}
      subtitle={`Mingleo platform · last 30 days · updated ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`}
      badge={<Pill tone="ink">Admin</Pill>}
      nav={NAV}
      active={tab}
      onNav={setTab}
      user={{ name: user?.name ?? '', initials, role: 'Platform admin' }}
      accent="ink"
      onLogout={logout}
      logoutTo="/login"
    >
      {tab === 'overview' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <Kpi label="People" value={num(overview.kpis.users)} icon={<Users size={16} />} />
            <Kpi label="Couples" value={num(overview.kpis.couples)} icon={<HeartHandshake size={16} />} tone="plum" />
            <Kpi label="Bookings (30 days)" value={num(overview.kpis.bookings30d)} icon={<CalendarCheck size={16} />} tone="sage" />
            <Kpi label="GMV (30 days)" value={inr(overview.kpis.gmv30d)} icon={<CreditCard size={16} />} tone="gold" />
            <Kpi label="Mingleo revenue" value={inr(overview.kpis.revenue30d)} icon={<Activity size={16} />} tone="sky" />
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Weekly booking GMV" className="xl:col-span-2">
              {overview.weekly.length > 1 ? <AreaChart data={overview.weekly.map((w) => w.gmv)} labels={overview.weekly.map((w) => w.label)} color="#4B3B7A" format={inr} /> : <p className="text-sm text-muted">Not enough data yet.</p>}
            </Panel>
            <Panel title="Proposal → couple funnel (30 days)"><Funnel steps={overview.funnel} /></Panel>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Revenue by stream">
              <Donut parts={STREAMS.map((x) => ({ label: x.label, value: Math.max(overview.streams[x.id] ?? 0, 0), color: x.color })).filter((x) => x.value > 0)} />
            </Panel>
            <Panel title="Safety at a glance" action={<button onClick={() => setTab('safety')} className="text-[13px] font-semibold text-ember cursor-pointer">Open queue</button>}>
              <div className="grid grid-cols-2 gap-3">
                {[['Open reports', overview.safety.openReports, 'text-gold'], ['Resolved', overview.safety.resolvedReports, 'text-sage'], ['Verified people', `${overview.safety.verifiedPct}%`, 'text-sky'], ['Reports / 100 bookings', overview.safety.incidentPct, 'text-sage']].map(([k, v, c]) => (
                  <div key={k as string} className="rounded-2xl bg-sand/70 p-3"><div className={`font-display text-2xl ${c}`}>{v}</div><div className="text-[11px] text-muted">{k}</div></div>
                ))}
              </div>
            </Panel>
            <Panel title="Top venues (7 days)">
              <div className="space-y-3">
                {overview.topVenues.map((t) => (
                  <div key={t.name} className="text-[13px]">
                    <div className="flex justify-between"><span className="font-medium">{t.name}</span><span className="font-semibold">{t.count}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-sand"><div className="h-full rounded-full bg-ember" style={{ width: `${(t.count / (overview.topVenues[0]?.count || 1)) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'safety' && (
        <div className="grid gap-5 animate-fade-in xl:grid-cols-2">
          <Panel title={<span className="flex items-center gap-2"><UserCheck size={17} /> Verification queue</span>}>
            <div className="space-y-2.5">
              {queue.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <Avatar config={v.avatar} size={40} />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold">{v.name}</div>
                    <div className="text-[12px] text-muted">{v.method ?? 'Selfie'}{v.score != null && ` · match score ${v.score}`}</div>
                  </div>
                  <button onClick={() => run(() => api(`/admin/users/${v.id}/verify`, { body: { approve: true } }), `${v.name} verified`)} aria-label="Approve" className="grid h-8 w-8 place-items-center rounded-full bg-sage-soft text-sage cursor-pointer"><Check size={15} /></button>
                  <button onClick={() => run(() => api(`/admin/users/${v.id}/verify`, { body: { approve: false } }), 'Sent back for re-verification')} aria-label="Reject" className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 cursor-pointer"><X size={15} /></button>
                </div>
              ))}
              {!queue.length && <div className="py-6 text-center text-sm text-muted">Queue clear ✨</div>}
            </div>
          </Panel>
          <Panel title={<span className="flex items-center gap-2"><AlertTriangle size={17} /> Automated flags</span>}>
            <div className="space-y-2.5">
              {flags.map((f) => (
                <div key={f.id} className="rounded-2xl border border-line p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] text-muted">{f.against}</span>
                    <Pill tone={f.severity === 'High' ? 'red' : f.severity === 'Medium' ? 'gold' : 'sand'}>{f.severity} risk</Pill>
                  </div>
                  <div className="mt-1 text-[14px] font-semibold">{f.type.replace(/^Automated: /, '')}</div>
                  <div className="mt-1 flex items-center justify-between text-[12px]">
                    <span className="text-muted">{ago(f.createdAt)}</span>
                    <div className="flex gap-3">
                      <button onClick={() => run(async () => { await api(`/admin/users/${f.against}/suspend`, { method: 'POST' }); await api(`/admin/reports/${f.id}`, { method: 'PATCH', body: { status: 'Resolved' } }) }, 'Account suspended')} className="font-semibold text-red-600 cursor-pointer">Suspend</button>
                      <button onClick={() => run(() => api(`/admin/reports/${f.id}`, { method: 'PATCH', body: { status: 'Resolved' } }), 'Flag dismissed')} className="font-semibold text-muted cursor-pointer">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))}
              {!flags.length && <div className="py-6 text-center text-sm text-muted">No open flags</div>}
            </div>
          </Panel>
          <Panel title={<span className="flex items-center gap-2"><Store size={17} /> Business verification</span>}>
            <Table head={['Business', 'Type', 'Area', 'Documents', '']} rows={pendingVenues.map((v) => [
              <span className="font-semibold">{v.name}</span>, v.kind, v.area, v.documents.join(', ') || '—',
              <button onClick={() => setReview(v.id)} className="text-[12px] font-semibold text-sage cursor-pointer">Review listing</button>,
            ])} />
            {!pendingVenues.length && <div className="py-4 text-center text-sm text-muted">No venues waiting</div>}
          </Panel>
          <Panel title={<span className="flex items-center gap-2"><Ban size={17} /> Blocks (7 days)</span>}>
            <BarChart data={[2, 3, 4, 5, 6, 7, 1].map((d) => blocks?.perDay.find((x) => x._id === d)?.n ?? 0)} labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} color="bg-ink" />
            <div className="mt-3 text-[13px] text-muted">{blocks?.total ?? 0} blocks this week</div>
          </Panel>
        </div>
      )}

      {tab === 'reports' && (
        <Panel title="Reports" action={<div className="flex gap-1.5">{(['All', 'Open', 'High'] as const).map((f) => <Chip key={f} size="sm" tone="ink" active={filter === f} onClick={() => setFilter(f)}>{f === 'High' ? 'High severity' : f}</Chip>)}</div>} className="animate-fade-in">
          <Table head={['ID', 'Type', 'Against', 'Reported by', 'Severity', 'When', 'Status', 'Actions']} rows={humanReports.map((r) => [
            <span className="font-semibold">{r.id}</span>, r.type, <span className="font-mono text-[12px]">{r.against}</span>, r.by,
            <Pill tone={r.severity === 'High' ? 'red' : r.severity === 'Medium' ? 'gold' : 'sand'}>{r.severity}</Pill>, ago(r.createdAt), <StatusPill status={r.status} />,
            <div className="flex gap-3 text-[12px] font-semibold">
              {r.status === 'Open' && <button onClick={() => run(() => api(`/admin/reports/${r.id}`, { method: 'PATCH', body: { status: 'In review' } }), `${r.id} in review`)} className="text-sky cursor-pointer">Review</button>}
              {r.status !== 'Resolved' && <button onClick={() => run(() => api(`/admin/reports/${r.id}`, { method: 'PATCH', body: { status: 'Resolved' } }), `${r.id} resolved`)} className="text-sage cursor-pointer">Resolve</button>}
              {r.status !== 'Escalated' && r.status !== 'Resolved' && <button onClick={() => run(() => api(`/admin/reports/${r.id}`, { method: 'PATCH', body: { status: 'Escalated' } }), `${r.id} escalated`)} className="flex items-center gap-1 text-red-600 cursor-pointer"><Gavel size={12} /> Escalate</button>}
            </div>,
          ])} />
        </Panel>
      )}

      {tab === 'users' && (
        <Panel title={`People (${users.length} most recent)`} className="animate-fade-in">
          <Table head={['Person', 'Age', 'Area', 'Mode', 'Verified', 'Bookings', 'Reports', 'Status', '']} rows={users.map((u) => [
            <span className="flex items-center gap-2"><Avatar config={u.avatar} size={28} /> <span className="font-semibold">{u.name}</span> <span className="font-mono text-[11px] text-muted">{u.id}</span></span>,
            u.age ?? '—', u.area ?? '—', u.mode, u.verified ? '✓' : '—', u.dates, u.reports, <StatusPill status={u.status === 'active' ? 'Active' : 'Suspended'} />,
            u.status === 'active'
              ? <button onClick={() => run(() => api(`/admin/users/${u.id}/suspend`, { method: 'POST' }), `${u.name} suspended`)} className="text-[12px] font-semibold text-red-600 cursor-pointer">Suspend</button>
              : <button onClick={() => run(() => api(`/admin/users/${u.id}/reinstate`, { method: 'POST' }), `${u.name} reinstated`)} className="text-[12px] font-semibold text-sage cursor-pointer">Reinstate</button>,
          ])} />
        </Panel>
      )}

      {tab === 'venues' && (
        <Panel title="Venues & providers" className="animate-fade-in">
          <Table head={['Venue', 'Type', 'Area', 'Plan', 'Status', '']} rows={venues.map((v) => [
            <span className="font-semibold">{v.name}{v.featured && <span className="ml-2 text-[11px] text-gold">★ Featured</span>}</span>, v.kind, v.area, v.plan, <StatusPill status={v.status === 'verified' ? 'Verified' : v.status === 'pending' ? 'Pending' : 'Suspended'} />,
            <div className="flex gap-3 text-[12px] font-semibold">
              <button onClick={() => setReview(v.id)} className="text-ink-soft cursor-pointer">Review</button>
              {v.status === 'verified'
                ? <button onClick={() => run(() => api(`/admin/venues/${v.id}/verify`, { body: { approve: false } }), `${v.name} suspended`)} className="text-red-600 cursor-pointer">Suspend</button>
                : <button onClick={() => run(() => api(`/admin/venues/${v.id}/verify`, { body: { approve: true } }), `${v.name} is live`)} className="text-sage cursor-pointer">Approve</button>}
            </div>,
          ])} />
        </Panel>
      )}

      {tab === 'bookings' && (
        <Panel title="Recent bookings" className="animate-fade-in">
          <Table head={['Ref', 'Type', 'Venue', 'When', 'Guests', 'GMV', 'Commission', 'Status']} rows={bookings.map((b) => [
            <span className="font-semibold">{b.ref}</span>, b.kind, b.venue, b.when, b.guests, inr(b.gmv), inr(b.commission), <StatusPill status={b.status[0].toUpperCase() + b.status.slice(1)} />,
          ])} />
        </Panel>
      )}

      {tab === 'revenue' && (
        <div className="grid gap-5 animate-fade-in xl:grid-cols-3">
          <Kpi label="GMV (30 days)" value={inr(overview.kpis.gmv30d)} tone="gold" />
          <Kpi label="Mingleo revenue (30 days)" value={inr(overview.kpis.revenue30d)} tone="sage" />
          <Kpi label="Take rate" value={`${overview.kpis.gmv30d ? ((overview.kpis.revenue30d / overview.kpis.gmv30d) * 100).toFixed(1) : 0}%`} tone="sky" />
          <Panel title="Revenue streams (30 days)" className="xl:col-span-3">
            <Table head={['Stream', 'Model', 'Revenue', 'Share']} rows={STREAMS.map((x) => [x.label, x.model, inr(overview.streams[x.id] ?? 0), `${Math.round(((overview.streams[x.id] ?? 0) / totalRevenue) * 100)}%`])} />
          </Panel>
        </div>
      )}
      <VenueReview slug={review} onClose={() => setReview(null)} onDecide={async (approve) => { const slug = review!; setReview(null); await run(() => api(`/admin/venues/${slug}/verify`, { body: { approve } }), approve ? 'Venue approved and live' : 'Venue rejected') }} />
    </DashboardShell>
  )
}

interface ReviewData {
  venue: Venue & { status: string; submittedAt?: string; owner: { name: string; email: string } | null; phone?: string; licence?: { fssai?: string; gst?: string } }
  packages: (Package & { active: boolean })[]
}

/** Full listing check before a venue goes live: photos, menu, facts, licences, packages. */
function VenueReview({ slug, onClose, onDecide }: { slug: string | null; onClose: () => void; onDecide: (approve: boolean) => void }) {
  const [data, setData] = useState<ReviewData | null>(null)
  useEffect(() => {
    setData(null)
    if (slug) api<ReviewData>(`/admin/venues/${slug}`).then(setData).catch(() => {})
  }, [slug])
  if (!slug) return null
  const v = data?.venue
  return (
    <Modal open onClose={onClose} title={v ? `Review: ${v.name}` : 'Loading…'} wide>
      {v && data && (
        <div className="space-y-5">
          <div className="grid gap-2 rounded-2xl bg-sand/60 p-4 text-[13px] sm:grid-cols-2">
            <div><span className="text-muted">Owner:</span> {v.owner?.name} · {v.owner?.email}</div>
            <div><span className="text-muted">Phone:</span> {v.phone || '—'}</div>
            <div><span className="text-muted">FSSAI:</span> <span className="font-mono">{v.licence?.fssai || '—'}</span></div>
            <div><span className="text-muted">GSTIN:</span> <span className="font-mono">{v.licence?.gst || '—'}</span></div>
            <div><span className="text-muted">Status:</span> {v.status}{v.submittedAt && ` · submitted ${new Date(v.submittedAt).toLocaleDateString('en-IN')}`}</div>
            <div><span className="text-muted">Packages:</span> {data.packages.map((p) => `${p.name} (${inr(p.price)})`).join(', ') || '—'}</div>
          </div>
          <VenueDetails venue={{ ...v, packages: data.packages, rating: 0, reviews: 0, verified: v.status === 'verified', emoji: v.kind === 'activity' ? '🎨' : '☕', tone: ['#FBEFD3', '#D9A23B'], ambience: v.ambience ?? [], treats: v.treats ?? [], slots: v.slots ?? [] }} />
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="danger" onClick={() => onDecide(false)}>Reject</Button>
            <Button variant="dark" onClick={() => onDecide(true)}>Approve &amp; publish</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
