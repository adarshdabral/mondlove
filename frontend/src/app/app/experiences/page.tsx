'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BadgeCheck, Clock, MapPin, Search } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { inr, upcomingDays } from '@/lib/constants'
import { useApi, useToast } from '@/lib/session'
import type { Booking, Venue } from '@/lib/types'
import { Button, Chip, Eyebrow, Pill, Sheet, VenueArt, inputCls } from '@/components/ui'
import { EmptyState, PageHeader, PageLoader } from '@/components/shared'

const CATS = [
  ['all', 'All', '✨'], ['restaurant', 'Restaurants', '🍽️'], ['cafe', 'Cafés', '☕'], ['activity', 'Activities', '🎳'],
  ['romantic', 'Romantic', '🕯️'], ['creative', 'Creative', '🎨'], ['adventure', 'Adventure', '🌄'], ['occasion', 'Special occasions', '🎂'],
]

function Experiences() {
  const search = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const { data, loading } = useApi<{ venues: Venue[] }>('/venues')
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Venue | null>(null)
  const [pkg, setPkg] = useState('')
  const [day, setDay] = useState(upcomingDays()[2])
  const [slot, setSlot] = useState('')
  const [busy, setBusy] = useState(false)

  const open = (v: Venue) => {
    setSel(v)
    setPkg(v.packages[0]?.id ?? '')
    setSlot(v.slots[0] ?? '')
  }
  useEffect(() => {
    const id = search.get('venue')
    const v = id && data?.venues.find((x) => x.id === id)
    if (v) open(v)
  }, [search, data])

  const list = useMemo(
    () => (data?.venues ?? []).filter((v) => cat === 'all' || v.kind === cat || v.tags?.includes(cat)).filter((v) => !q || `${v.name} ${v.category} ${v.area} ${v.packages.map((p) => p.name).join(' ')}`.toLowerCase().includes(q.toLowerCase())),
    [data, cat, q],
  )
  if (loading) return <PageLoader />
  const p = sel?.packages.find((x) => x.id === pkg)

  return (
    <div>
      <PageHeader eyebrow="Experiences" title="Find your next date." sub="Verified cafés, restaurants and experiences, each with date packages for two." />
      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pottery, jazz, rooftop…" className={`${inputCls} pl-10`} />
      </div>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
        {CATS.map(([id, l, e]) => (
          <button key={id} onClick={() => setCat(id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition cursor-pointer ${cat === id ? 'bg-ink text-white' : 'border border-line bg-white text-ink-soft'}`}>{e} {l}</button>
        ))}
      </div>
      {list.length ? (
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <button key={v.id} onClick={() => open(v)} className="overflow-hidden rounded-3xl border border-line/70 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift cursor-pointer">
              <div className="relative">
                <VenueArt emoji={v.emoji} tone={v.tone} className="h-36" size="lg" />
                {v.featured && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Featured</span>}
              </div>
              <div className="p-4">
                <div className="font-semibold">{v.packages[0]?.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted">{v.name} {v.verified && <BadgeCheck size={12} className="fill-sky text-white" />}</div>
                <div className="mt-2 flex flex-wrap gap-1"><Pill>{v.category}</Pill><Pill tone="sage"><Clock size={10} /> {v.slots.length} slots a day</Pill></div>
                <div className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="font-semibold">{v.packages[0] && inr(Math.min(...v.packages.map((x) => x.price)))} <span className="font-normal text-muted">for two</span></span>
                  <span className="text-muted"><MapPin size={11} className="inline" /> {v.area} · ★ {v.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState emoji="🔍" title="Nothing matches" body="Try another category. New partners join every week." />
      )}

      <Sheet open={!!sel} onClose={() => setSel(null)}>
        {sel && (
          <div>
            <VenueArt emoji={sel.emoji} tone={sel.tone} className="h-36 rounded-3xl" size="lg" />
            <div className="mt-4 text-xs font-semibold text-muted">{sel.category} · {sel.area} · ★ {sel.rating} ({sel.reviews})</div>
            <h3 className="mt-1 font-display text-[26px] leading-tight">{sel.name}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">{sel.ambience.map((a) => <Pill key={a}>{a}</Pill>)}</div>
            <div className="mt-4 space-y-2">
              {sel.packages.map((x) => (
                <button key={x.id} onClick={() => setPkg(x.id)} className={`w-full rounded-2xl border p-3 text-left cursor-pointer ${pkg === x.id ? 'border-ember bg-ember-soft/60' : 'border-line bg-white'}`}>
                  <div className="flex justify-between font-semibold"><span>{x.name}</span><span>{inr(x.price)}</span></div>
                  <div className="text-[12px] text-ink-soft">{x.includes.join(' · ')}</div>
                </button>
              ))}
            </div>
            <Eyebrow className="mt-5">Day</Eyebrow>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">{upcomingDays().map((d) => <Chip key={d} active={day === d} onClick={() => setDay(d)}>{d}</Chip>)}</div>
            <Eyebrow className="mt-4">Time</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-2">{sel.slots.map((s) => <Chip key={s} tone="ink" active={slot === s} onClick={() => setSlot(s)}>{s}</Chip>)}</div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="font-display text-2xl">{p && inr(p.price)}</div>
                <div className="text-[11px] text-muted">for two · free cancellation 24h before</div>
              </div>
              <Button
                disabled={!p || !slot || busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const { booking } = await api<{ booking: Booking }>('/bookings', { body: { kind: 'marketplace', venueId: sel.id, packageId: pkg, day, time: slot } })
                    toast('Booked ✨', 'success')
                    router.push(`/app/bookings/${booking.id}?new=1`)
                  } catch (e) {
                    toast(errorMessage(e), 'warn')
                    setBusy(false)
                  }
                }}
              >
                {busy ? 'Booking…' : 'Book'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

export default function ExperiencesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Experiences />
    </Suspense>
  )
}
