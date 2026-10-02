'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gift } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { GIFTS, MOODS, OCCASIONS, inr, upcomingDays } from '@/lib/constants'
import { useApi, useToast } from '@/lib/session'
import type { Booking, Treat, Venue } from '@/lib/types'
import { useCouple } from '@/components/AppShell'
import { Button, Card, Chip, Progress, VenueArt, inputCls } from '@/components/ui'
import { EmptyState, PageLoader, TreatPicker } from '@/components/shared'

const STEPS = ['Occasion', 'Vibe', 'Venue', 'Taste', 'Gift', 'When', 'Review']
const HINTS = ['Dress comfortably.', 'Dress up a little.', 'Bring a jacket.', 'Come hungry.', 'Wear shoes you can walk in.']

export default function Surprise() {
  const router = useRouter()
  const toast = useToast()
  const { data: coupleData } = useCouple()
  const { data, loading } = useApi<{ venues: Venue[] }>('/venues')
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [s, setS] = useState({ occasion: 'birthday', vibe: 'romantic', venueId: '', packageId: '', treat: null as Treat | null, gift: 'flowers', day: upcomingDays()[4], time: '', hint: HINTS[1], message: '' })
  const set = (p: Partial<typeof s>) => setS((x) => ({ ...x, ...p }))
  const venue = useMemo(() => data?.venues.find((v) => v.id === s.venueId), [data, s.venueId])

  if (!coupleData) return <PageLoader />
  const partner = coupleData.couple?.partner
  if (!partner) {
    return <EmptyState emoji="🎁" title="Surprises are for couples" body="Link your partner first. Then you can plan everything in secret." action={<Link href="/app/profile#partner" className="font-semibold text-plum">Link your partner</Link>} />
  }
  if (loading || !data) return <PageLoader />
  const pkg = venue?.packages.find((p) => p.id === s.packageId)
  const gift = GIFTS.find((g) => g.id === s.gift)!
  const can = [true, true, !!venue && !!pkg, true, true, !!s.time, true][step]

  const book = async () => {
    setBusy(true)
    try {
      const { booking } = await api<{ booking: Booking }>('/bookings', {
        body: {
          kind: 'surprise', venueId: s.venueId, packageId: s.packageId, day: s.day, time: s.time, title: `Surprise for ${partner.name}`,
          items: [pkg!.name, ...(s.treat ? [s.treat.name] : [])], gift: gift.price ? { id: gift.id, label: gift.label, price: gift.price } : undefined, hint: s.hint, message: s.message || undefined,
        },
      })
      toast(`Surprise booked. ${partner.name} only sees the teaser 🤫`, 'success')
      router.push(`/app/bookings/${booking.id}`)
    } catch (e) {
      toast(errorMessage(e), 'warn')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-ember via-[#d4664a] to-plum p-7 text-white">
        <Progress step={step + 1} total={STEPS.length} tone="bg-white" />
        <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">🤫 Top secret · {STEPS[step]}</div>
        <h1 className="mt-1 font-display text-[30px] leading-tight">
          {['What are we celebrating?', 'Pick the vibe.', 'Where should it happen?', `What should ${partner.name} taste?`, 'Add a little something.', 'When?', 'The secret plan'][step]}
        </h1>
        <p className="mt-1 text-sm text-white/75">{partner.name} won&apos;t see a thing except the day, time and your hint.</p>
      </div>

      <div key={step} className="mt-6 animate-fade-up">
        {step === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{OCCASIONS.map((o) => <button key={o.id} onClick={() => set({ occasion: o.id })} className={`rounded-3xl border p-5 text-left transition cursor-pointer ${s.occasion === o.id ? 'border-ember bg-ember-soft' : 'border-line bg-white'}`}><div className="text-3xl">{o.emoji}</div><div className="mt-2 font-semibold">{o.label}</div></button>)}</div>}
        {step === 1 && <div className="grid gap-2 sm:grid-cols-2">{MOODS.map((m) => <button key={m.id} onClick={() => set({ vibe: m.id })} className={`flex items-center gap-4 rounded-3xl border p-4 text-left cursor-pointer ${s.vibe === m.id ? 'border-ember bg-ember-soft' : 'border-line bg-white'}`}><span className="text-3xl">{m.emoji}</span><span className="font-semibold">{m.label}</span></button>)}</div>}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.venues.filter((v) => v.packages.length).map((v) => (
                <button key={v.id} onClick={() => set({ venueId: v.id, packageId: v.packages[0].id, treat: null, time: v.slots[0] })} className={`flex items-center gap-3 rounded-3xl border p-3 text-left cursor-pointer ${s.venueId === v.id ? 'border-ember bg-ember-soft' : 'border-line bg-white'}`}>
                  <VenueArt emoji={v.emoji} tone={v.tone} className="h-14 w-14 shrink-0 rounded-2xl" size="sm" />
                  <div className="min-w-0"><div className="truncate font-semibold">{v.name}</div><div className="truncate text-xs text-muted">{v.category} · {v.area} · ★ {v.rating}</div></div>
                </button>
              ))}
            </div>
            {venue && <div className="flex flex-wrap gap-2">{venue.packages.map((p) => <Chip key={p.id} active={s.packageId === p.id} onClick={() => set({ packageId: p.id })}>{p.name} · {inr(p.price)}</Chip>)}</div>}
          </div>
        )}
        {step === 3 && venue && <TreatPicker treats={venue.treats} value={s.treat} onChange={(t) => set({ treat: t })} />}
        {step === 4 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{GIFTS.map((g) => <button key={g.id} onClick={() => set({ gift: g.id })} className={`rounded-2xl border p-4 text-left cursor-pointer ${s.gift === g.id ? 'border-ember bg-ember-soft' : 'border-line bg-white'}`}><div className="text-3xl">{g.emoji}</div><div className="mt-2 text-[14px] font-semibold">{g.label}</div><div className="text-[11px] text-muted">{g.note}</div>{g.price > 0 && <div className="mt-1 text-[11px] font-semibold text-ember-dark">+{inr(g.price)}</div>}</button>)}</div>}
        {step === 5 && venue && (
          <div className="space-y-5">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{upcomingDays().map((d) => <Chip key={d} active={s.day === d} onClick={() => set({ day: d })}>{d}</Chip>)}</div>
            <div className="flex flex-wrap gap-2">{venue.slots.map((t) => <Chip key={t} tone="ink" active={s.time === t} onClick={() => set({ time: t })}>{t}</Chip>)}</div>
            <div>
              <div className="mb-2 text-[13px] font-semibold text-ink-soft">The only hint {partner.name} gets</div>
              <div className="flex flex-wrap gap-2">{HINTS.map((h) => <Chip key={h} active={s.hint === h} onClick={() => set({ hint: h })}>{h}</Chip>)}</div>
            </div>
            <textarea value={s.message} maxLength={280} onChange={(e) => set({ message: e.target.value })} placeholder={`A note for ${partner.name}, revealed on the day (optional)`} className={`${inputCls} h-20`} />
          </div>
        )}
        {step === 6 && venue && pkg && (
          <Card className="divide-y divide-line p-6 text-[14px]">
            {[
              ['Occasion', OCCASIONS.find((o) => o.id === s.occasion)?.label],
              ['Vibe', MOODS.find((m) => m.id === s.vibe)?.label],
              ['Venue', venue.name],
              ['Experience', pkg.name],
              ['Taste', s.treat?.name ?? 'Their choice on the day'],
              ['Gift', gift.label],
              ['When', `${s.day} · ${s.time}`],
              ['Hint', s.hint],
            ].map(([k, v]) => <div key={k} className="flex justify-between py-2.5"><span className="text-muted">{k}</span><span className="font-semibold">{v}</span></div>)}
            <div className="flex justify-between pt-3"><span className="text-muted">Total for two</span><span className="font-display text-xl">{inr(pkg.price + gift.price)}</span></div>
          </Card>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-20 z-30 border-t border-line/60 bg-cream/90 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-3xl justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!can} onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button disabled={busy} icon={<Gift size={16} />} onClick={book}>{busy ? 'Booking…' : 'Book the surprise'}</Button>
          )}
        </div>
      </div>
    </div>
  )
}
